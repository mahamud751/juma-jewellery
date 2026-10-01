"use client";

import { Hud } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { SHOTS } from "@/lib/journey";
import { DepthPhoto, PHOTO_ASPECT, PHOTO_FOV } from "./depth-photo";
import { Foreground, type Spin } from "./showcase";
import { MallPassage, type MallLook } from "./mall-passage";

type Props = {
  progress: RefObject<number>;
  spin: RefObject<Spin>;
  mallLook: RefObject<MallLook>;
  reduced: boolean;
  onLoad: (loaded: number, total: number) => void;
  onReady: () => void;
  onFailure: () => void;
};

/** Eases the scroll position so every move glides, and lets a flicked creation coast to a stop. */
function Driver({ progress, easedRef, spinRef, reduced }: { progress: RefObject<number>; easedRef: RefObject<number>; spinRef: RefObject<Spin>; reduced: boolean }) {
  useFrame((_, delta) => {
    const dt = Math.min(delta, .05);
    easedRef.current = reduced ? progress.current : THREE.MathUtils.damp(easedRef.current, progress.current, 5.5, dt);
    const s = spinRef.current;
    if (s && Math.abs(s.velocity) > .0005) { s.angle += s.velocity * dt; s.velocity *= Math.exp(-2.6 * dt); }
  }, -2);
  return null;
}

/**
 * The photos move around a still camera. It only drifts with the pointer, which is what makes the
 * depth read, and its lens is chosen so the 4:3 photographs always cover the screen.
 */
function MainCamera({ reduced }: { reduced: boolean }) {
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const size = useThree((state) => state.size);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.current.tx = event.clientX / innerWidth * 2 - 1;
      pointer.current.ty = event.clientY / innerHeight * 2 - 1;
    };
    const tilt = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      pointer.current.tx = THREE.MathUtils.clamp(event.gamma / 25, -1, 1);
      pointer.current.ty = THREE.MathUtils.clamp((event.beta - 45) / 25, -1, 1);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("deviceorientation", tilt);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("deviceorientation", tilt); };
  }, []);
  useFrame(({ camera, clock }, delta) => {
    const p = pointer.current;
    const k = 1 - Math.exp(-3 * Math.min(delta, .05));
    p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
    const breathe = reduced ? 0 : Math.sin(clock.elapsedTime * .35) * .012;
    const amount = reduced ? 0 : 1;
    camera.position.set(p.x * .09 * amount + breathe, -p.y * .055 * amount, 0);
    camera.lookAt(p.x * .2 * amount, -p.y * .12 * amount, -10);
    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = size.width / Math.max(1, size.height);
      const halfV = THREE.MathUtils.degToRad(PHOTO_FOV / 2);
      const halfH = Math.atan(Math.tan(halfV) * PHOTO_ASPECT);
      // Leave a margin so the pointer drift never reaches the edge of the photograph.
      const fov = THREE.MathUtils.radToDeg(2 * Math.min(Math.atan(Math.tan(halfV) * .88), Math.atan(Math.tan(halfH) * .88 / aspect)));
      if (Math.abs(camera.fov - fov) > .01 || camera.aspect !== aspect) { camera.fov = fov; camera.aspect = aspect; camera.updateProjectionMatrix(); }
    }
  }, -1);
  return null;
}

function ContextWatch({ onFailure }: { onFailure: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  return null;
}

export default function JourneyStage({ progress, spin, mallLook, reduced, onLoad, onReady, onFailure }: Props) {
  const eased = useRef(progress.current);
  const loaded = useRef(new Set<string>());
  const first = `${SHOTS[0].photo}-${SHOTS[0].from}`;
  const handleLoaded = useCallback((key: string) => {
    loaded.current.add(key);
    onLoad(loaded.current.size, SHOTS.length);
    if (key === first) onReady();
  }, [first, onLoad, onReady]);
  return <Canvas
    dpr={[1, 1.75]}
    camera={{ position: [0, 0, 0], fov: 45, near: .05, far: 200 }}
    gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
  >
    <color attach="background" args={["#0b0907"]} />
    <Driver progress={progress} easedRef={eased} spinRef={spin} reduced={reduced} />
    <MainCamera reduced={reduced} />
    <ContextWatch onFailure={onFailure} />
    <MallPassage progress={eased} look={mallLook} reduced={reduced} onError={onFailure} />
    {SHOTS.map((shot, index) => <DepthPhoto key={`${shot.photo}-${shot.from}`} shot={shot} next={SHOTS[index + 1]} progress={eased} onLoaded={handleLoaded} onError={onFailure} />)}
    <Hud renderPriority={1}>
      <Foreground progress={eased} spin={spin} reduced={reduced} />
    </Hud>
  </Canvas>;
}
