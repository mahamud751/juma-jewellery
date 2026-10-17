"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { HALL } from "@/lib/showroom";
import { Halo, fluteTexture, latticeTexture, useMaterials } from "./kit";

const LENGTH = HALL.start - HALL.end;
const MID = (HALL.start + HALL.end) / 2;
/** Pilasters and ceiling beams sit halfway between displays. */
const BAYS = Array.from({ length: 11 }, (_, i) => 12.5 - i * 5);
/** Lit niches of busts fill the wall wherever there is no display, as along the salon's walls. */
const NICHES = { left: [11, 5, -5, -15, -25, -35], right: [11, 5, 0, -10, -20, -30, -35] };
const DOWNLIGHTS = Array.from({ length: 24 }, (_, i) => 17 - i * 2.5);

/** The salon's own walls: honey wood flutes, with the hexagon jali lit from behind above. */
function useHallMaterials() {
  const materials = useMemo(() => {
    const side = fluteTexture(Math.round(LENGTH / 0.1));
    const end = fluteTexture(Math.round((HALL.halfWidth * 2) / 0.1));
    const jali = latticeTexture(LENGTH / 0.62, 0.82);
    return {
      side: new THREE.MeshStandardMaterial({ map: side, bumpMap: side, bumpScale: 3, roughness: 0.42, metalness: 0.05 }),
      end: new THREE.MeshStandardMaterial({ map: end, bumpMap: end, bumpScale: 3, roughness: 0.42, metalness: 0.05 }),
      jali: new THREE.MeshStandardMaterial({ map: jali, alphaTest: 0.5, roughness: 0.45, metalness: 0.1, side: THREE.DoubleSide }),
      marble: new THREE.MeshStandardMaterial({ color: "#c4b398", roughness: 0.38, metalness: 0.05 }),
      inlay: new THREE.MeshStandardMaterial({ color: "#b8956a", roughness: 0.2, metalness: 0.1 }),
      ceiling: new THREE.MeshStandardMaterial({ color: "#f1e9da", roughness: 0.7 }),
    };
  }, []);
  useEffect(() => () => Object.values(materials).forEach((material) => {
    material.map?.dispose();
    material.dispose();
  }), [materials]);
  return materials;
}

let bustParts: { body: THREE.BufferGeometry; chain: THREE.BufferGeometry; drop: THREE.BufferGeometry } | null = null;
/** Geometry for the display busts, built once and shared by every niche. */
function bust() {
  if (bustParts) return bustParts;
  const profile = [
    [0, 0], [0.15, 0], [0.16, 0.03], [0.12, 0.07], [0.14, 0.16], [0.21, 0.28], [0.28, 0.37],
    [0.27, 0.41], [0.17, 0.46], [0.08, 0.49], [0.062, 0.53], [0.062, 0.64], [0.04, 0.66], [0, 0.66],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.LatheGeometry(profile, 32);
  body.scale(1, 1, 0.38);
  bustParts = { body, chain: new THREE.TorusGeometry(0.1, 0.007, 6, 32, Math.PI), drop: new THREE.OctahedronGeometry(0.028) };
  return bustParts;
}

/** A display bust in royal blue velvet with a gold necklace, as on the salon's niche shelves. */
function Bust({ x, y, scale }: { x: number; y: number; scale: number }) {
  const m = useMaterials();
  const parts = bust();
  return (
    <group position={[x, y, 0.12]} scale={scale}>
      <mesh geometry={parts.body} material={m.velvet} />
      <mesh geometry={parts.chain} material={m.gold} position={[0, 0.5, 0.06]} rotation={[0.5, 0, Math.PI]} />
      <mesh geometry={parts.chain} material={m.gold} position={[0, 0.47, 0.08]} rotation={[0.45, 0, Math.PI]} scale={1.35} />
      <mesh geometry={parts.drop} material={m.gold} position={[0, 0.33, 0.135]} />
    </group>
  );
}

/** A cream arched niche with gold shelves and busts, built facing +z. */
function NicheUnit({ x, z, yaw }: { x: number; z: number; yaw: number }) {
  const m = useMaterials();
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.36, 0.05]} material={m.wood}><boxGeometry args={[1.42, 0.72, 0.5]} /></mesh>
      <mesh position={[0, 0.73, 0.05]} material={m.gold}><boxGeometry args={[1.44, 0.025, 0.52]} /></mesh>
      <mesh position={[0, 1.95, -0.02]} material={m.niche}><planeGeometry args={[1.3, 2.5]} /></mesh>
      <mesh position={[0, 3.2, -0.02]} material={m.niche}><circleGeometry args={[0.65, 40, 0, Math.PI]} /></mesh>
      <mesh position={[0, 3.2, 0]} material={m.gold}><torusGeometry args={[0.68, 0.03, 10, 48, Math.PI]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.68, 1.95, 0]} material={m.gold}><boxGeometry args={[0.05, 2.5, 0.06]} /></mesh>)}
      {[1.5, 2.3].map((y) => <mesh key={y} position={[0, y, 0.12]} material={m.gold}><boxGeometry args={[1.28, 0.04, 0.28]} /></mesh>)}
      <Bust x={-0.32} y={0.745} scale={0.95} />
      <Bust x={0.32} y={0.745} scale={0.95} />
      <Bust x={-0.32} y={1.52} scale={0.95} />
      <Bust x={0.32} y={1.52} scale={0.95} />
      <Bust x={0} y={2.32} scale={1.15} />
      <Halo base={0.1} gain={0} size={2} position={[0, 2.1, 0.02]} color="#ffe3b0" />
    </group>
  );
}

/**
 * The salon hall, in the materials of the photographs: fluted honey wood, a backlit jali frieze,
 * cream marble with a stone inlay, a cream ceiling of downlights and gold trim.
 */
export function Hall({ fancy }: { fancy: boolean }) {
  const m = useMaterials();
  const h = useHallMaterials();
  const W = HALL.halfWidth;
  const H = HALL.height;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, MID]} material={fancy ? undefined : h.marble}>
        <planeGeometry args={[W * 2, LENGTH]} />
        {fancy ? (
          <MeshReflectorMaterial resolution={512} blur={[300, 90]} mixBlur={1} mixStrength={1.1} mirror={0.4} roughness={0.35} metalness={0.15} depthScale={0.8} minDepthThreshold={0.4} maxDepthThreshold={1.2} color="#c9b99d" />
        ) : null}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, MID - 1]} material={h.inlay}>
        <planeGeometry args={[2.2, LENGTH - 6]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`rb${s}`} rotation={[-Math.PI / 2, 0, 0]} position={[s * 1.12, 0.005, MID - 1]} material={m.gold}>
          <planeGeometry args={[0.035, LENGTH - 6]} />
        </mesh>
      ))}

      {[-1, 1].map((s) => (
        <group key={`wall${s}`}>
          <mesh position={[s * (W + 0.15), H / 2, MID]} material={h.side}><boxGeometry args={[0.3, H, LENGTH]} /></mesh>
          {/* gold skirting and the rail under the frieze */}
          <mesh position={[s * (W - 0.02), 0.06, MID]} material={m.gold}><boxGeometry args={[0.04, 0.12, LENGTH]} /></mesh>
          <mesh position={[s * (W - 0.04), 3.42, MID]} material={m.gold}><boxGeometry args={[0.08, 0.05, LENGTH]} /></mesh>
          {/* the jali frieze, lit from behind */}
          <mesh position={[s * (W - 0.01), 3.86, MID]} rotation={[0, -s * Math.PI / 2, 0]} material={m.niche}><planeGeometry args={[LENGTH, 0.82]} /></mesh>
          <mesh position={[s * (W - 0.06), 3.86, MID]} rotation={[0, -s * Math.PI / 2, 0]} material={h.jali}><planeGeometry args={[LENGTH, 0.82]} /></mesh>
          <mesh position={[s * (W - 0.05), 4.3, MID]} material={m.gold}><boxGeometry args={[0.1, 0.06, LENGTH]} /></mesh>
        </group>
      ))}

      {NICHES.left.map((z) => <NicheUnit key={`nl${z}`} x={-W + 0.07} z={z} yaw={Math.PI / 2} />)}
      {NICHES.right.map((z) => <NicheUnit key={`nr${z}`} x={W - 0.07} z={z} yaw={-Math.PI / 2} />)}

      {BAYS.map((z) => (
        <group key={z}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * (W - 0.1), 0, z]}>
              <mesh position={[0, 1.7, 0]} material={m.wood}><boxGeometry args={[0.2, 3.4, 0.36]} /></mesh>
              {[-1, 1].map((e) => <mesh key={e} position={[-s * 0.11, 1.7, e * 0.17]} material={m.gold}><boxGeometry args={[0.02, 3.4, 0.025]} /></mesh>)}
              <mesh position={[-s * 0.02, 0.1, 0]} material={m.gold}><boxGeometry args={[0.22, 0.2, 0.42]} /></mesh>
              <mesh position={[-s * 0.16, 2.75, 0]} material={m.gold}><cylinderGeometry args={[0.05, 0.03, 0.16, 16]} /></mesh>
              <mesh position={[-s * 0.16, 2.88, 0]} material={m.led}><sphereGeometry args={[0.045, 16, 12]} /></mesh>
              <Halo base={0.3} gain={0} size={1.3} position={[-s * 0.2, 2.9, 0]} rotation={[0, (-s * Math.PI) / 2, 0]} />
            </group>
          ))}
          <mesh position={[0, H - 0.07, z]} material={m.cream}><boxGeometry args={[W * 2, 0.14, 0.3]} /></mesh>
          {[-1, 1].map((e) => <mesh key={e} position={[0, H - 0.15, z + e * 0.15]} material={m.gold}><boxGeometry args={[W * 2, 0.02, 0.02]} /></mesh>)}
        </group>
      ))}

      {/* cream ceiling with a gold-edged tray down the middle and rows of downlights */}
      <mesh position={[0, H + 0.01, MID]} rotation={[Math.PI / 2, 0, 0]} material={h.ceiling}>
        <planeGeometry args={[W * 2, LENGTH]} />
      </mesh>
      {[-1, 1].map((e) => (
        <group key={`tray${e}`}>
          <mesh position={[e * 1.3, H - 0.06, MID]} material={m.gold}><boxGeometry args={[0.04, 0.03, LENGTH]} /></mesh>
          <mesh position={[e * 1.24, H - 0.02, MID]} material={m.led}><boxGeometry args={[0.02, 0.01, LENGTH]} /></mesh>
        </group>
      ))}
      {DOWNLIGHTS.flatMap((z) => [-2.3, 0, 2.3].map((x) => (
        <mesh key={`dl${x}${z}`} position={[x, H - 0.005, z]} rotation={[Math.PI / 2, 0, 0]} material={m.led}>
          <circleGeometry args={[0.065, 20]} />
        </mesh>
      )))}

      <mesh position={[0, H / 2, HALL.end - 0.15]} material={h.end}><boxGeometry args={[W * 2 + 0.6, H, 0.3]} /></mesh>
      <mesh position={[0, H / 2, HALL.start + 0.15]} material={h.end}><boxGeometry args={[W * 2 + 0.6, H, 0.3]} /></mesh>
    </group>
  );
}
