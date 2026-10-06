"use client";

import { PerformanceMonitor, Sparkles, useProgress } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Studio } from "@/components/jewels";
import { CHAPTER_COUNT, DISPLAYS, facing, focusOf, fovFor, shotFor, travelSeconds } from "@/lib/showroom";
import { DisplayFor } from "./displays";
import { Hall } from "./hall";
import { MaterialsProvider } from "./kit";

type Refs = { sectionRef: RefObject<number>; smoothRef: RefObject<number>; menuRef: RefObject<boolean>; reduced: boolean; initial?: number };

function LoadBridge({ onProgress }: { onProgress: (value: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => onProgress(progress), [onProgress, progress]);
  return null;
}

const UP = new THREE.Vector3(0, 1, 0);
const v3 = (value: readonly number[]) => new THREE.Vector3(value[0], value[1], value[2]);

/**
 * One timed flight per chapter change, eased once over the whole path, as on GRAIR. Position runs
 * straight between the two shots; the view turns from one display, down the length of the hall in
 * the direction of travel, and onto the next, so crossing the hall is a sweep rather than a whip-pan.
 */
function Rig({ sectionRef, smoothRef, menuRef, reduced, initial = 0 }: Refs) {
  const flight = useRef({ from: initial, to: initial, start: 0, duration: 0 });
  const now = useRef<{ position: THREE.Vector3; dir: THREE.Vector3 } | null>(null);
  const scratch = useRef({ position: new THREE.Vector3(), dir: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), travel: new THREE.Vector3(), side: new THREE.Vector3(), look: new THREE.Vector3() });

  useFrame(({ size, clock, camera, pointer }, delta) => {
    const aspect = size.width / size.height;
    const fov = fovFor(aspect);
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    const target = sectionRef.current ?? 0;
    const time = clock.elapsedTime;
    const trip = flight.current;
    if (target !== trip.to) {
      trip.from = smoothRef.current ?? 0;
      trip.to = target;
      trip.start = time;
      trip.duration = reduced ? 0 : travelSeconds(trip.from, target);
    }
    const t = trip.duration > 0 ? Math.min(1, (time - trip.start) / trip.duration) : 1;
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    smoothRef.current = THREE.MathUtils.lerp(trip.from, trip.to, eased);

    const max = CHAPTER_COUNT - 1;
    const s = THREE.MathUtils.clamp(smoothRef.current, 0, max);
    const index = Math.min(max - 1, Math.floor(s));
    const k = s - index;
    const from = shotFor(index, aspect);
    const to = shotFor(index + 1, aspect);
    const { position, dir, a, b, travel, side, look } = scratch.current;
    a.copy(v3(from.position));
    b.copy(v3(to.position));
    position.lerpVectors(a, b, k);
    travel.subVectors(b, a).setY(0);
    if (travel.lengthSq() > 1e-6) travel.normalize();
    a.copy(v3(from.target)).sub(v3(from.position)).normalize();
    b.copy(v3(to.target)).sub(v3(to.position)).normalize();
    dir.lerpVectors(a, b, k).addScaledVector(travel, Math.sin(Math.PI * k) * 1.1).normalize();

    side.crossVectors(dir, UP).normalize();
    if (!reduced) {
      position.addScaledVector(side, pointer.x * 0.12);
      position.y += pointer.y * 0.06;
    }
    if (menuRef.current) position.addScaledVector(dir, -1.4);

    if (!now.current) now.current = { position: position.clone(), dir: dir.clone() };
    const follow = reduced ? 1 : 1 - Math.pow(0.03, Math.min(delta, 0.05));
    now.current.position.lerp(position, follow);
    now.current.dir.lerp(dir, follow).normalize();
    camera.position.copy(now.current.position);
    camera.lookAt(look.copy(now.current.position).add(now.current.dir));
  });

  return null;
}

/** Light position for a chapter: above and in front of the piece. */
function keyFor(chapter: number) {
  const focus = focusOf(Math.max(1, chapter));
  const [nx, nz] = facing(DISPLAYS[Math.max(0, chapter - 1)].yaw);
  return [focus[0] + nx * 1.6, focus[1] + 2.1, focus[2] + nz * 1.6];
}

/**
 * The key light travels with the camera from piece to piece, so only two real lights are ever
 * needed, however long the hall gets.
 */
function FollowLight({ smoothRef, reduced }: { smoothRef: RefObject<number>; reduced: boolean }) {
  const spot = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const dust = useRef<THREE.Group>(null);
  const aim = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const s = THREE.MathUtils.clamp(smoothRef.current ?? 0, 0, CHAPTER_COUNT - 1);
    const i = Math.min(CHAPTER_COUNT - 2, Math.floor(s));
    const k = s - i;
    const a = keyFor(i), b = keyFor(i + 1);
    const fa = focusOf(Math.max(1, i)), fb = focusOf(i + 1);
    const lerp = (x: number[], y: number[]) => x.map((v, n) => v + (y[n] - v) * k) as [number, number, number];
    const key = lerp(a, b);
    const focus = lerp(fa, fb);
    // Brightest when the camera has landed, dipping while it travels.
    const settled = 1 - Math.sin(Math.PI * (s - Math.floor(s))) * 0.55;
    spot.current?.position.set(...key);
    aim.position.set(...focus);
    if (spot.current) spot.current.intensity = 13 * settled;
    fill.current?.position.set(focus[0], focus[1] + 0.4, focus[2]);
    if (fill.current) fill.current.intensity = 2.2 * settled;
    dust.current?.position.set(...focus);
  });
  return (
    <>
      <primitive object={aim} />
      <spotLight ref={spot} target={aim} angle={0.55} penumbra={0.85} distance={9} decay={1.6} color="#ffe2b3" />
      <pointLight ref={fill} distance={4} decay={2} color="#ffc983" />
      <group ref={dust}>
        <Sparkles count={45} scale={[2.6, 2.2, 2]} size={2} speed={reduced ? 0 : 0.25} color="#ffd98f" opacity={0.65} noise={0.5} />
      </group>
    </>
  );
}

function Scene({ fancy, onProgress, ...refs }: Refs & { fancy: boolean; onProgress: (value: number) => void }) {
  return (
    <>
      <color attach="background" args={["#1a120b"]} />
      <fog attach="fog" args={["#24180e", 16, 52]} />
      <LoadBridge onProgress={onProgress} />
      <Rig {...refs} />
      <Studio neutral />
      <ambientLight intensity={0.38} color="#ffeccf" />
      <hemisphereLight args={["#fff1d8", "#6e4a26", 0.5]} />
      <directionalLight position={[2, 6, 8]} intensity={0.8} color="#fff0d8" />
      <FollowLight smoothRef={refs.smoothRef} reduced={refs.reduced} />
      <MaterialsProvider>
        <Hall fancy={fancy} />
        {DISPLAYS.map((display, index) => (
          <DisplayFor key={index} display={display} chapter={index + 1} smoothRef={refs.smoothRef} reduced={refs.reduced} />
        ))}
      </MaterialsProvider>
      {fancy ? (
        <EffectComposer enableNormalPass={false} multisampling={2}>
          <Bloom luminanceThreshold={1.05} luminanceSmoothing={0.2} mipmapBlur intensity={0.55} />
        </EffectComposer>
      ) : null}
    </>
  );
}

export default function ShowroomStage({ fancy, paused, onProgress, initial = 0, ...refs }: Omit<Refs, "smoothRef"> & { fancy: boolean; paused: boolean; onProgress: (value: number) => void; initial?: number }) {
  const smoothRef = useRef(initial);
  const [lowRes, setLowRes] = useState(false);
  const low = !fancy || lowRes;
  return (
    <Canvas
      className="webgl"
      dpr={low ? 1 : [1, 1.5]}
      frameloop={paused ? "never" : "always"}
      gl={{ antialias: !fancy, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.8, 15.6], fov: 30, near: 0.05, far: 70 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      {fancy ? <PerformanceMonitor onDecline={() => setLowRes(true)} flipflops={2} onFallback={() => setLowRes(true)} /> : null}
      <Scene fancy={fancy} onProgress={onProgress} smoothRef={smoothRef} initial={initial} {...refs} />
    </Canvas>
  );
}
