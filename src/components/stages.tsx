"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { Glow } from "@/components/jewels";
import { RigPoint, RigSpot, type LightProxy } from "@/components/room-rig";
import { Jewel } from "@/components/models";
import { METALS, type Model } from "@/lib/catalog";
import { CONSTANT_ORIGIN, CONSTANT_YAW, NOCTURNE_ORIGIN, NOCTURNE_YAW } from "@/lib/sections";

const WALL = { color: "#0b0a0f", roughness: 0.88, metalness: 0.1 };
const PLATINUM = METALS.platinum.color;
const HALO = new THREE.Color("#cfe0ff");

/** 0 far away, 1 when the camera has arrived at `index`. */
const nearness = (section: number, index: number, span = 1.2) => 1 - Math.min(1, Math.abs(section - index) / span);

/** Chapter V: the Constant pieces turning on a dais under a halo of light. */
export function ConstantStage({ sectionRef, reduced }: { sectionRef: RefObject<number>; reduced: boolean }) {
  const table = useRef<THREE.Group>(null);
  const key = useRef<LightProxy>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, delta) => {
    if (table.current) table.current.rotation.y += delta * (reduced ? 0.02 : 0.16);
    const near = nearness(sectionRef.current ?? 0, 4);
    if (key.current) key.current.intensity = 10 + near * 50;
    if (halo.current) halo.current.color.setScalar(0.35 + near * 0.65).multiply(HALO);
  });

  return (
    <group position={CONSTANT_ORIGIN} rotation={[0, CONSTANT_YAW, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7, 64]} />
        <meshStandardMaterial color="#08070b" metalness={0.8} roughness={0.32} />
      </mesh>
      <mesh position={[0, 3, -3]}>
        <boxGeometry args={[10, 6, 0.3]} />
        <meshStandardMaterial {...WALL} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 5, 3, -0.5]}>
          <boxGeometry args={[0.3, 6, 5]} />
          <meshStandardMaterial {...WALL} />
        </mesh>
      ))}

      {/* halo light ring on the wall behind the dais */}
      <mesh position={[0, 1.5, -2.83]}>
        <torusGeometry args={[1.3, 0.016, 12, 128]} />
        <meshBasicMaterial ref={halo} color="#cfe0ff" toneMapped={false} />
      </mesh>
      <Glow position={[0, 1.5, -2.84]} rotation={[0, 0, 0]} size={4} opacity={0.14} color="#9fb8ff" />

      {/* dais */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.25, 1.3, 0.3, 96]} />
        <meshPhysicalMaterial color="#141119" roughness={0.3} metalness={0.3} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.302, 0]}>
        <cylinderGeometry args={[1.26, 1.26, 0.008, 96]} />
        <meshStandardMaterial color="#dcd8e6" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.32, 1.42, 96]} />
        <meshBasicMaterial color="#9fb8ff" toneMapped={false} />
      </mesh>
      <Glow position={[0, 0.31, 0]} size={2.4} opacity={0.35} color="#b8c9ff" />

      <group ref={table} position={[0, 0.31, 0]}>
        <Jewel model="tennis" metal={PLATINUM} stone="white" position={[0, 0.03, 0.1]} rotation={[-0.67, 0, 0]} scale={0.95} />
        <Jewel model="eternity" metal={PLATINUM} stone="white" position={[-0.78, 0.3, -0.35]} rotation={[0, 0.5, 0]} scale={0.75} />
        <Jewel model="hoops" metal={METALS["yellow-gold"].color} stone="ice" position={[0.72, 0.26, -0.45]} rotation={[0, -0.4, 0]} scale={0.8} />
      </group>

      <RigSpot ref={key} room="constant" position={[0.5, 4.6, 1.8]} target={[0, 0.3, 0]} angle={0.42} penumbra={0.9} intensity={40} distance={10} color="#f4f6ff" castShadow />
      <RigPoint room="constant" position={[-2, 1.2, 1.5]} intensity={4} distance={6} color="#6f8cff" />
    </group>
  );
}

const NICHES: { model: Model; col: number; row: number }[] = [
  { model: "halo", col: 0, row: 1 },
  { model: "riviera", col: 1, row: 1 },
  { model: "drops", col: 2, row: 1 },
  { model: "cuff", col: 0, row: 0 },
  { model: "pendant", col: 1, row: 0 },
  { model: "eternity", col: 2, row: 0 },
];

const NICHE_W = 1.2;
const NICHE_H = 1.15;

function Niche({ model, index, reduced }: { model: Model; index: number; reduced: boolean }) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * (reduced ? 0.02 : 0.2 + index * 0.02);
  });

  const frame = { color: "#1a1720", metalness: 0.7, roughness: 0.3 };
  return (
    <group>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[NICHE_W, NICHE_H]} />
        <meshBasicMaterial color="#1b0f33" toneMapped={false} />
      </mesh>
      <Glow position={[0, 0.1, 0.01]} rotation={[0, 0, 0]} size={1.3} opacity={0.4} color="#8a55ff" />
      {[
        [0, NICHE_H / 2, NICHE_W + 0.08, 0.04],
        [0, -NICHE_H / 2, NICHE_W + 0.08, 0.04],
        [-NICHE_W / 2, 0, 0.04, NICHE_H],
        [NICHE_W / 2, 0, 0.04, NICHE_H],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.18]}>
          <boxGeometry args={[w, h, 0.36]} />
          <meshStandardMaterial {...frame} />
        </mesh>
      ))}
      <mesh position={[0, NICHE_H / 2 - 0.03, 0.2]}>
        <boxGeometry args={[NICHE_W - 0.1, 0.012, 0.012]} />
        <meshBasicMaterial color="#efe6ff" toneMapped={false} />
      </mesh>
      <group ref={spin} position={[0, 0.02, 0.24]}>
        <Jewel model={model} metal={PLATINUM} stone="violet" scale={0.62} />
      </group>
    </group>
  );
}

/** Chapter VI: the Nocturne vault, six one-of-one pieces in lit niches. */
export function NocturneVault({ reduced }: { reduced: boolean }) {
  return (
    <group position={NOCTURNE_ORIGIN} rotation={[0, NOCTURNE_YAW, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#07060a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.75, -2.35]}>
        <boxGeometry args={[10, 5.5, 0.3]} />
        <meshStandardMaterial {...WALL} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 4.6, 2.75, 0]}>
            <boxGeometry args={[0.3, 5.5, 4.8]} />
            <meshStandardMaterial {...WALL} />
          </mesh>
          <mesh position={[side * 4.44, 2.75, -1.6]}>
            <boxGeometry args={[0.02, 5.2, 0.02]} />
            <meshBasicMaterial color="#9d74ff" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* niche wall, left of centre so the copy has the right-hand field */}
      <group position={[-1.2, 0, -2.2]}>
        {NICHES.map((n, i) => (
          <group key={n.model} position={[(n.col - 1) * 1.45, 0.95 + n.row * 1.42, 0]}>
            <Niche model={n.model} index={i} reduced={reduced} />
          </group>
        ))}
        <RoundedBox args={[4.6, 0.08, 0.5]} radius={0.02} position={[0, 0.2, 0.25]}>
          <meshStandardMaterial color="#1a1720" metalness={0.7} roughness={0.3} />
        </RoundedBox>
      </group>
      <Glow position={[-1.2, 0.01, -1.2]} size={5} opacity={0.2} color="#7a4dff" />

      <RigSpot room="nocturne" position={[1.5, 5, 3]} target={[-1.2, 1.6, -2.2]} angle={0.55} penumbra={1} intensity={45} distance={12} color="#f3eeff" />
      <RigPoint room="nocturne" position={[-1.2, 1.7, -0.5]} intensity={5} distance={4} color="#c8b0ff" />
    </group>
  );
}
