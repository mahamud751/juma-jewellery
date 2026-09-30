"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Hotspot } from "@/lib/tour";

type Props = { src: string; hotspots: Hotspot[]; renderSpot: (spot: Hotspot) => ReactNode };

const RADIUS = 40;
const toRadians = THREE.MathUtils.degToRad;

/** yaw/pitch in degrees → a point on the viewing sphere. Yaw 0 is the centre of the equirectangular image. */
function direction(yaw: number, pitch: number, radius = RADIUS) {
  const y = toRadians(yaw);
  const p = toRadians(pitch);
  return new THREE.Vector3(Math.sin(y) * Math.cos(p) * radius, Math.sin(p) * radius, -Math.cos(y) * Math.cos(p) * radius);
}

function Sphere({ src }: { src: string }) {
  const texture = useTexture(src, (map) => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
  });
  // Flipped on x so the image reads from the inside; turned so the image centre faces −z.
  return <mesh scale={[-1, 1, 1]} rotation={[0, -Math.PI / 2, 0]}>
    <sphereGeometry args={[500, 64, 40]} />
    <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
  </mesh>;
}

function Look({ start }: { start: number }) {
  const gl = useThree((state) => state.gl);
  const view = useRef({ yaw: start, pitch: 0, targetYaw: start, targetPitch: 0, fov: 72 });
  useEffect(() => {
    const element = gl.domElement;
    let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
    const down = (event: PointerEvent) => {
      drag = { x: event.clientX, y: event.clientY, yaw: view.current.targetYaw, pitch: view.current.targetPitch };
      element.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!drag) return;
      const perPixel = view.current.fov / element.clientHeight;
      view.current.targetYaw = drag.yaw - (event.clientX - drag.x) * perPixel;
      view.current.targetPitch = THREE.MathUtils.clamp(drag.pitch + (event.clientY - drag.y) * perPixel, -75, 75);
    };
    const up = () => { drag = null; };
    // Plain scrolling walks to the next spot; only pinch (ctrl + wheel) zooms the panorama.
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      view.current.fov = THREE.MathUtils.clamp(view.current.fov + event.deltaY * .04, 35, 90);
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.removeEventListener("wheel", wheel);
    };
  }, [gl]);
  useFrame(({ camera }, delta) => {
    const state = view.current;
    const ease = 1 - Math.exp(-10 * Math.min(delta, .05));
    state.yaw += (state.targetYaw - state.yaw) * ease;
    state.pitch += (state.targetPitch - state.pitch) * ease;
    camera.lookAt(direction(state.yaw, state.pitch, 1));
    if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - state.fov) > .01) {
      camera.fov += (state.fov - camera.fov) * ease;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

export default function PanoView({ src, hotspots, renderSpot }: Props) {
  const first = hotspots.find((spot) => spot.yaw !== undefined);
  return <Canvas className="tour-pano" camera={{ position: [0, 0, 0.01], fov: 72, near: .1, far: 1000 }} dpr={[1, 2]}>
    <Sphere src={src} />
    <Look start={first?.yaw ?? 0} />
    {hotspots.filter((spot) => spot.yaw !== undefined).map((spot) => (
      <Html key={spot.label} position={direction(spot.yaw!, spot.pitch ?? 0)} center zIndexRange={[20, 10]}>
        {renderSpot(spot)}
      </Html>
    ))}
  </Canvas>;
}
