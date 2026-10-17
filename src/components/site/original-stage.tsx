"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { ReliefPhoto } from "@/components/relief-photo";

const FIT = 1.55;

function Scene({ src, turnRef, velRef, zoomRef }: { src: string; turnRef: RefObject<number>; velRef: RefObject<number>; zoomRef: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const glow = useRef<THREE.CanvasTexture | null>(null);
  if (!glow.current) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "rgba(255,214,140,0.28)");
      gradient.addColorStop(0.45, "rgba(180,120,40,0.05)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    glow.current = texture;
  }
  useEffect(() => () => glow.current?.dispose(), []);
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    turnRef.current = THREE.MathUtils.clamp(turnRef.current + velRef.current * dt, -1.05, 1.05);
    velRef.current *= Math.exp(-2.4 * dt);
    if (group.current) {
      group.current.rotation.y = turnRef.current + Math.sin(clock.elapsedTime * 0.35) * 0.1;
      group.current.rotation.x = Math.sin(clock.elapsedTime * 0.28) * 0.03;
    }
    if (camera instanceof THREE.PerspectiveCamera) {
      const view = size.width / Math.max(1, size.height);
      const half = THREE.MathUtils.degToRad(camera.fov / 2);
      const margin = FIT * 1.22;
      const distH = margin / 2 / Math.tan(half);
      const distW = margin / 2 / (Math.tan(half) * view);
      const fitted = Math.max(distH, distW);
      const next = fitted / Math.max(0.82, zoomRef.current);
      if (Math.abs(camera.position.z - next) > 0.01) camera.position.set(0, 0, next);
    }
  });
  return (
    <>
      <color attach="background" args={["#0c0a08"]} />
      <ambientLight intensity={0.55} color="#fff4e4" />
      <directionalLight position={[2.4, 3.2, 4]} intensity={2.6} color="#fff1d6" />
      <directionalLight position={[-3, 1.2, -2]} intensity={0.7} color="#d5e2ff" />
      <mesh position={[0, -0.05, -0.7]}>
        <planeGeometry args={[2.1, 2.1]} />
        <meshBasicMaterial map={glow.current} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={group}>
        <ReliefPhoto src={src} fit={FIT} cutout />
      </group>
    </>
  );
}

export function OriginalStage({ src, alt }: { src: string; alt: string }) {
  const turnRef = useRef(0);
  const velRef = useRef(0);
  const zoomRef = useRef(1);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; lock: boolean | null } | null>(null);
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomRef.current = THREE.MathUtils.clamp(zoomRef.current * Math.exp(-event.deltaY * 0.0016), 0.82, 2.6);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);
  return (
    <div
      ref={stage}
      className="original-stage"
      data-cursor="Turn"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lock: null };
        velRef.current = 0;
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current || current.id !== event.pointerId) return;
        const dx = event.clientX - current.x;
        const dy = event.clientY - current.y;
        if (current.lock === null) {
          if (Math.hypot(dx, dy) < 6) return;
          current.lock = Math.abs(dx) > Math.abs(dy);
        }
        if (!current.lock) return;
        turnRef.current = THREE.MathUtils.clamp(turnRef.current + dx * 0.0075, -1.05, 1.05);
        velRef.current = 0;
        current.x = event.clientX;
        current.y = event.clientY;
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <Canvas
        className="original-canvas"
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 3.4], fov: 32, near: 0.05, far: 20 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Scene src={src} turnRef={turnRef} velRef={velRef} zoomRef={zoomRef} />
      </Canvas>
      <p className="pdp-hint">Drag to turn · Scroll to look closer</p>
      <p className="sr-only">{alt}</p>
    </div>
  );
}
