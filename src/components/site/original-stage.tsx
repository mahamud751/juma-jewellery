"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { ReliefPhoto } from "@/components/relief-photo";

const FIT = 1.55;

function Scene({ src, turnRef, velRef }: { src: string; turnRef: RefObject<number>; velRef: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
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
      const next = Math.max(distH, distW);
      if (Math.abs(camera.position.z - next) > 0.01) camera.position.set(0, 0, next);
    }
  });
  return (
    <>
      <color attach="background" args={["#10141c"]} />
      <ambientLight intensity={0.5} color="#fff4e4" />
      <directionalLight position={[2.4, 3.2, 4]} intensity={2.5} color="#fff1d6" />
      <directionalLight position={[-3, 1.2, -2]} intensity={0.7} color="#d5e2ff" />
      <group ref={group}>
        <ReliefPhoto src={src} fit={FIT} />
      </group>
    </>
  );
}

export function OriginalStage({ src, alt }: { src: string; alt: string }) {
  const turnRef = useRef(0);
  const velRef = useRef(0);
  const drag = useRef<{ id: number; x: number; y: number; lock: boolean | null } | null>(null);
  return (
    <div
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
        <Scene src={src} turnRef={turnRef} velRef={velRef} />
      </Canvas>
      <p className="pdp-hint">Drag to turn · photographed in the salon</p>
      <p className="sr-only">{alt}</p>
    </div>
  );
}
