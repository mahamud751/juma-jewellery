"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { HALL } from "@/lib/showroom";
import { Halo, useMaterials } from "./kit";

const LENGTH = HALL.start - HALL.end;
const MID = (HALL.start + HALL.end) / 2;
/** Pilasters and ceiling beams sit halfway between displays. */
const BAYS = Array.from({ length: 11 }, (_, i) => 12.5 - i * 5);

/** The salon hall: velvet walls over carved wainscot, a red runner, gold beams and wall lamps. */
export function Hall({ fancy }: { fancy: boolean }) {
  const m = useMaterials();
  const W = HALL.halfWidth;
  const H = HALL.height;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, MID]}>
        <planeGeometry args={[W * 2, LENGTH]} />
        {fancy ? (
          <MeshReflectorMaterial resolution={512} blur={[300, 80]} mixBlur={1} mixStrength={2.2} mirror={0.55} roughness={0.6} metalness={0.4} depthScale={0.9} minDepthThreshold={0.4} maxDepthThreshold={1.2} color="#120d09" />
        ) : (
          <meshStandardMaterial color="#120d09" roughness={0.25} metalness={0.3} />
        )}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, MID - 1]} material={m.carpet}>
        <planeGeometry args={[1.4, LENGTH - 6]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`rb${s}`} rotation={[-Math.PI / 2, 0, 0]} position={[s * 0.72, 0.005, MID - 1]} material={m.gold}>
          <planeGeometry args={[0.04, LENGTH - 6]} />
        </mesh>
      ))}

      {[-1, 1].map((s) => (
        <group key={`wall${s}`}>
          <mesh position={[s * (W + 0.15), H / 2, MID]} material={m.wall}><boxGeometry args={[0.3, H, LENGTH]} /></mesh>
          <mesh position={[s * (W - 0.03), 0.48, MID]} material={m.woodDark}><boxGeometry args={[0.06, 0.96, LENGTH]} /></mesh>
          <mesh position={[s * (W - 0.05), 0.97, MID]} material={m.gold}><boxGeometry args={[0.06, 0.035, LENGTH]} /></mesh>
          <mesh position={[s * (W - 0.05), 3.82, MID]} material={m.gold}><boxGeometry args={[0.08, 0.05, LENGTH]} /></mesh>
          <mesh position={[s * (W - 0.04), 4.12, MID]} material={m.woodDark}><boxGeometry args={[0.08, 0.56, LENGTH]} /></mesh>
          <mesh position={[s * (W - 0.1), 3.86, MID]} material={m.led}><boxGeometry args={[0.015, 0.015, LENGTH]} /></mesh>
        </group>
      ))}

      {BAYS.map((z) => (
        <group key={z}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * (W - 0.1), 0, z]}>
              <mesh position={[0, H / 2, 0]} material={m.wood}><boxGeometry args={[0.2, H, 0.36]} /></mesh>
              <mesh position={[-s * 0.02, 3.7, 0]} material={m.gold}><boxGeometry args={[0.22, 0.1, 0.42]} /></mesh>
              <mesh position={[-s * 0.02, 0.1, 0]} material={m.gold}><boxGeometry args={[0.22, 0.2, 0.42]} /></mesh>
              {/* wall lamp */}
              <mesh position={[-s * 0.16, 2.75, 0]} material={m.gold}><cylinderGeometry args={[0.05, 0.03, 0.16, 16]} /></mesh>
              <mesh position={[-s * 0.16, 2.88, 0]} material={m.led}><sphereGeometry args={[0.045, 16, 12]} /></mesh>
              <Halo base={0.32} gain={0} size={1.3} position={[-s * 0.2, 2.9, 0]} rotation={[0, (-s * Math.PI) / 2, 0]} />
            </group>
          ))}
          <mesh position={[0, H - 0.08, z]} material={m.woodDark}><boxGeometry args={[W * 2, 0.16, 0.26]} /></mesh>
          <mesh position={[0, H - 0.17, z]} material={m.gold}><boxGeometry args={[W * 2, 0.025, 0.28]} /></mesh>
          {/* pendant over the runner */}
          <mesh position={[0, H - 0.45, z]} material={m.gold}><cylinderGeometry args={[0.008, 0.008, 0.6, 6]} /></mesh>
          <mesh position={[0, H - 0.8, z]} material={m.led}><sphereGeometry args={[0.06, 16, 12]} /></mesh>
          <Halo base={0.22} gain={0} size={1.2} position={[0, H - 0.8, z]} />
        </group>
      ))}

      <mesh position={[0, H + 0.01, MID]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W * 2, LENGTH]} />
        <meshStandardMaterial color="#0d0805" roughness={0.8} />
      </mesh>
      <mesh position={[0, H / 2, HALL.end - 0.15]} material={m.wall}><boxGeometry args={[W * 2 + 0.6, H, 0.3]} /></mesh>
      <mesh position={[0, H / 2, HALL.start + 0.15]} material={m.wall}><boxGeometry args={[W * 2 + 0.6, H, 0.3]} /></mesh>
    </group>
  );
}
