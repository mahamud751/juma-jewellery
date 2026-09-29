"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { Diamond, Glow, TINTS } from "@/components/jewels";
import { Cove, Rock, WashedWall } from "@/components/plaster";
import { RigPoint, RigSpot, type LightProxy } from "@/components/room-rig";
import { CHAMBER_ORIGIN } from "@/lib/sections";

/** Room bounds in chamber space: back wall at x = BACK, side walls at z = LEFT / RIGHT. */
const BACK = -2.55;
const FRONT = 4.65;
const LEFT = 2.15;
const RIGHT = -2.4;
const HEIGHT = 4.4;
const ROCK = 1.35;

/**
 * The final room: a violet plaster chamber lit only from coves along the ceiling,
 * one stone resting on a standing rock under a single shaft of light.
 */
export function NamesChamber({ fancy, reduced, sectionRef }: { fancy: boolean; reduced: boolean; sectionRef: RefObject<number> }) {
  const stone = useRef<THREE.Group>(null);
  const shaft = useRef<LightProxy>(null);

  useFrame((_, delta) => {
    if (stone.current) stone.current.rotation.y += delta * (reduced ? 0.03 : 0.16);
    const near = 1 - Math.min(1, Math.abs((sectionRef.current ?? 0) - 7) / 1.2);
    if (shaft.current) shaft.current.intensity = 10 + near * 55;
  });

  const long = FRONT - BACK;
  const deep = LEFT - RIGHT;
  const midX = (FRONT + BACK) / 2;
  const midZ = (LEFT + RIGHT) / 2;

  return (
    <group position={CHAMBER_ORIGIN}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0, 0.35]} receiveShadow>
        <planeGeometry args={[8.5, 7]} />
        {fancy ? (
          <MeshReflectorMaterial
            resolution={512}
            blur={[260, 80]}
            mixBlur={1}
            mixStrength={2.2}
            mirror={0.7}
            roughness={0.6}
            metalness={0.55}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#0c0914"
          />
        ) : (
          <meshStandardMaterial color="#0c0914" metalness={0.8} roughness={0.3} envMapIntensity={0.8} />
        )}
      </mesh>

      {/* walls washed from the ceiling coves, the back wall brightest */}
      <WashedWall size={[deep, HEIGHT]} position={[BACK, HEIGHT / 2, midZ]} rotation={[0, Math.PI / 2, 0]} strength={1.15} />
      <WashedWall size={[long, HEIGHT]} position={[midX, HEIGHT / 2, LEFT]} rotation={[0, Math.PI, 0]} strength={0.95} />
      <WashedWall size={[long, HEIGHT]} position={[midX, HEIGHT / 2, RIGHT]} strength={0.8} />
      <WashedWall size={[long, deep]} position={[midX, HEIGHT, midZ]} rotation={[Math.PI / 2, 0, 0]} wash="edges" strength={0.7} />

      <Cove length={deep} position={[BACK + 0.05, HEIGHT - 0.04, midZ]} rotation={[0, Math.PI / 2, 0]} />
      <Cove length={long} position={[midX, HEIGHT - 0.04, LEFT - 0.05]} />
      <Cove length={long} position={[midX, HEIGHT - 0.04, RIGHT + 0.05]} />

      <Rock height={ROCK} width={0.46} position={[0.75, 0, 0.3]} rotation={[0, 0.6, 0]} />
      <group ref={stone} position={[0.75, ROCK + 0.17, 0.3]}>
        <Diamond fancy={fancy} bounces={fancy ? 5 : 2} scale={0.29} tint={TINTS.amethyst} />
      </group>

      <Glow position={[0.75, 0.01, 0.3]} size={2.4} opacity={0.4} color="#8a63ff" />

      <RigSpot ref={shaft} room="chamber" position={[0.9, 4.3, 0.1]} target={[0.75, ROCK, 0.3]} angle={0.3} penumbra={0.85} intensity={40} distance={9} color="#e6dcff" castShadow />
      <RigPoint room="chamber" position={[-1.4, 1.4, 1.1]} intensity={6} distance={6} color="#6a4dff" />
      <RigPoint room="chamber" position={[2.4, 0.6, -0.6]} intensity={2.5} distance={4} color="#b39bff" />
    </group>
  );
}
