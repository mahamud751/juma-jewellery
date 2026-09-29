"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { Bust, Diamond, Glow, TINTS } from "@/components/jewels";
import { RigPoint, RigSpot, type LightProxy } from "@/components/room-rig";
import { GALLERY_ORIGIN } from "@/lib/sections";


const FACE_YAW = Math.atan2(0.657, -0.754);

/** [x, z, plinth height, tint] in gallery space, staggered back into the room. */
const VITRINES = [
  [-1.55, 0.55, 0.95, TINTS.ice],
  [-2.55, -0.55, 1.1, TINTS.champagne],
  [-0.2, 1.45, 0.8, TINTS.violet],
] as const;

const WALL = { color: "#0c0a10", roughness: 0.88, metalness: 0.1 };

function Vitrine({ fancy, height, tint, index }: { fancy: boolean; height: number; tint: (typeof TINTS)[keyof typeof TINTS]; index: number }) {
  const stone = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (stone.current) stone.current.rotation.y += delta * (0.25 + index * 0.05);
  });

  return (
    <group rotation={[0, FACE_YAW, 0]}>
      <RoundedBox args={[0.46, height, 0.46]} radius={0.015} position={[0, height / 2, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#141118" roughness={0.35} metalness={0.3} clearcoat={0.5} />
      </RoundedBox>
      <mesh position={[0, height + 0.004, 0]}>
        <boxGeometry args={[0.47, 0.008, 0.47]} />
        <meshStandardMaterial color="#dcd8e6" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, height + 0.26, 0]}>
        <boxGeometry args={[0.44, 0.52, 0.44]} />
        {/* Thin glass needs no refraction: a transmission material would re-render the whole scene every frame. */}
        <meshPhysicalMaterial color="#ffffff" roughness={0.02} metalness={0} ior={1.5} transparent opacity={0.16} envMapIntensity={1.4} depthWrite={false} />
      </mesh>
      <group ref={stone} position={[0, height + 0.24, 0]} rotation={[0.35, 0, 0]}>
        <Diamond fancy={fancy} bounces={2} scale={0.12} tint={tint} />
      </group>
      <Glow position={[0, height + 0.012, 0]} size={0.5} opacity={0.6} color={tint.deep} />
    </group>
  );
}

export function PresenceGallery({ fancy, sectionRef }: { fancy: boolean; sectionRef: RefObject<number> }) {
  const key = useRef<LightProxy>(null);

  useFrame(() => {
    const near = 1 - Math.min(1, Math.abs((sectionRef.current ?? 0) - 3) / 1.35);
    if (key.current) key.current.intensity = 10 + near * 44;
  });

  return (
    <group position={GALLERY_ORIGIN}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.4, 0, 0.2]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#08070b" metalness={0.75} roughness={0.34} />
      </mesh>

      {/* two walls meeting in a corner, each with a violet LED cove at the floor and a slit up top */}
      <mesh position={[-0.4, 1.8, 2.2]}>
        <boxGeometry args={[7, 3.6, 0.1]} />
        <meshStandardMaterial {...WALL} />
      </mesh>
      <mesh position={[-3.4, 1.8, -0.2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[5, 3.6, 0.1]} />
        <meshStandardMaterial {...WALL} />
      </mesh>
      <mesh position={[-0.4, 0.03, 2.13]}>
        <boxGeometry args={[7, 0.02, 0.02]} />
        <meshBasicMaterial color="#a67dff" toneMapped={false} />
      </mesh>
      <mesh position={[-3.33, 0.03, -0.2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[5, 0.02, 0.02]} />
        <meshBasicMaterial color="#a67dff" toneMapped={false} />
      </mesh>
      <mesh position={[-0.4, 3.2, 2.13]}>
        <boxGeometry args={[5.4, 0.025, 0.02]} />
        <meshBasicMaterial color="#f1ebff" toneMapped={false} />
      </mesh>
      <Glow position={[-0.4, 0.01, 1.9]} size={3} opacity={0.18} color="#8a55ff" />

      {/* the bust on its low plinth */}
      <RoundedBox args={[0.9, 0.18, 0.9]} radius={0.02} position={[0, 0.09, 0]} rotation={[0, FACE_YAW, 0]} receiveShadow castShadow>
        <meshPhysicalMaterial color="#141118" roughness={0.3} metalness={0.3} clearcoat={0.6} />
      </RoundedBox>
      <Bust fancy={fancy} position={[0, 0.18, 0]} rotation={[0, FACE_YAW, 0]} />
      <Glow position={[0, 0.005, 0]} size={1.8} opacity={0.3} color="#7a4dff" />

      {VITRINES.map(([x, z, height, tint], index) => (
        <group key={index} position={[x, 0, z]}>
          <Vitrine fancy={fancy} height={height} tint={tint} index={index} />
        </group>
      ))}

      <RigSpot ref={key} room="gallery" position={[2.4, 3.4, -2.2]} target={[0, 1.2, 0]} angle={0.4} penumbra={0.9} intensity={36} distance={10} color="#fff6ee" castShadow />
      <RigPoint room="gallery" position={[-2.2, 1.8, 1.4]} intensity={6} distance={6} color="#7a45ff" />
      <RigPoint room="gallery" position={[0.6, 1.2, -0.6]} intensity={1.6} distance={2.5} color="#e8dcff" />
    </group>
  );
}
