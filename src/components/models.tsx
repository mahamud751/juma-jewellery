"use client";

import type { ThreeElements } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Chain, Diamond, TINTS } from "@/components/jewels";
import { brilliantGeometry } from "@/lib/brilliant";
import type { Model, StoneId } from "@/lib/catalog";

type Tint = (typeof TINTS)[StoneId];
type Build = { metal: string; tint: Tint; fancy: boolean };

const UP = new THREE.Vector3(0, 1, 0);
const FRONT = new THREE.Vector3(0, 0, 1);

function Metal({ color }: { color: string }) {
  return <meshStandardMaterial color={color} metalness={1} roughness={0.2} envMapIntensity={2} />;
}

type Stone = { position: THREE.Vector3; facing: THREE.Vector3; scale: number };

/** Small accent stones: one instanced mesh, mirror facets instead of ray-traced refraction. */
function Melee({ stones, tint }: { stones: Stone[]; tint: Tint }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const helper = new THREE.Object3D();
    stones.forEach((stone, i) => {
      helper.position.copy(stone.position);
      helper.quaternion.setFromUnitVectors(UP, stone.facing.clone().normalize());
      helper.scale.setScalar(stone.scale);
      helper.updateMatrix();
      target.setMatrixAt(i, helper.matrix);
    });
    target.count = stones.length;
    target.instanceMatrix.needsUpdate = true;
  }, [stones]);

  return (
    <instancedMesh ref={mesh} args={[brilliantGeometry(), undefined, stones.length]}>
      <meshStandardMaterial color={tint.color} metalness={1} roughness={0.02} envMapIntensity={2.6} />
    </instancedMesh>
  );
}

/** A closed or open tube swept along a circle-ish path with the given cross-section. */
function sweep(profile: THREE.Shape, radius: [number, number], from = 0, to = Math.PI * 2, steps = 160) {
  const closed = to - from >= Math.PI * 2 - 1e-3;
  const count = 64;
  const points = Array.from({ length: closed ? count : count + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / count;
    return new THREE.Vector3(Math.sin(a) * radius[0], -Math.cos(a) * radius[1], 0);
  });
  const path = new THREE.CatmullRomCurve3(points, closed);
  return new THREE.ExtrudeGeometry(profile, { steps, bevelEnabled: false, extrudePath: path });
}

const knife = () => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.05);
  s.quadraticCurveTo(0.034, 0, 0, 0.05);
  s.quadraticCurveTo(-0.034, 0, 0, -0.05);
  return s;
};

const flat = (width: number, depth: number) => {
  const s = new THREE.Shape();
  const r = Math.min(width, depth) * 0.45;
  s.moveTo(-depth / 2 + r, -width / 2);
  s.lineTo(depth / 2 - r, -width / 2);
  s.quadraticCurveTo(depth / 2, -width / 2, depth / 2, -width / 2 + r);
  s.lineTo(depth / 2, width / 2 - r);
  s.quadraticCurveTo(depth / 2, width / 2, depth / 2 - r, width / 2);
  s.lineTo(-depth / 2 + r, width / 2);
  s.quadraticCurveTo(-depth / 2, width / 2, -depth / 2, width / 2 - r);
  s.lineTo(-depth / 2, -width / 2 + r);
  s.quadraticCurveTo(-depth / 2, -width / 2, -depth / 2 + r, -width / 2);
  return s;
};

function Claws({ radius, height, metal, count = 4, y = 0 }: { radius: number; height: number; metal: string; count?: number; y?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.PI / 4;
        const x = Math.cos(a);
        const z = Math.sin(a);
        return (
          <mesh key={i} position={[x * radius, y, z * radius]} rotation={[z * 0.28, 0, -x * 0.28]}>
            <capsuleGeometry args={[radius * 0.11, height, 4, 8]} />
            <Metal color={metal} />
          </mesh>
        );
      })}
    </>
  );
}

function SolitaireModel({ metal, tint, fancy }: Build) {
  const band = useMemo(() => sweep(knife(), [0.36, 0.36]), []);
  return (
    <group position={[0, -0.12, 0]}>
      <mesh geometry={band}>
        <Metal color={metal} />
      </mesh>
      <group position={[0, 0.36, 0]}>
        <mesh position={[0, 0.07, 0]}>
          <torusGeometry args={[0.1, 0.011, 10, 40]} />
          <Metal color={metal} />
        </mesh>
        <Claws radius={0.1} height={0.16} metal={metal} y={0.1} />
        <Diamond fancy={fancy} bounces={3} position={[0, 0.16, 0]} scale={0.13} tint={tint} />
      </group>
    </group>
  );
}

function HaloModel({ metal, tint, fancy }: Build) {
  const band = useMemo(() => sweep(knife(), [0.36, 0.36]), []);
  const halo = useMemo<Stone[]>(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return {
          position: new THREE.Vector3(Math.cos(a) * 0.2, 0.495, Math.sin(a) * 0.2),
          facing: new THREE.Vector3(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5),
          scale: 0.034,
        };
      }),
    [],
  );
  return (
    <group position={[0, -0.14, 0]}>
      <mesh geometry={band}>
        <Metal color={metal} />
      </mesh>
      <mesh position={[0, 0.47, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.022, 10, 48]} />
        <Metal color={metal} />
      </mesh>
      <mesh position={[0, 0.41, 0]}>
        <cylinderGeometry args={[0.2, 0.08, 0.1, 32, 1, true]} />
        <meshStandardMaterial color={metal} metalness={1} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <Melee stones={halo} tint={TINTS.white} />
      <Claws radius={0.12} height={0.12} metal={metal} y={0.5} />
      <Diamond fancy={fancy} bounces={3} position={[0, 0.53, 0]} scale={0.15} tint={tint} />
    </group>
  );
}

function EternityModel({ metal, tint }: Build) {
  const band = useMemo(() => sweep(flat(0.1, 0.05), [0.36, 0.36]), []);
  const stones = useMemo<Stone[]>(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.sin(a), -Math.cos(a), 0);
        return { position: dir.clone().multiplyScalar(0.39), facing: dir, scale: 0.046 };
      }),
    [],
  );
  return (
    <group rotation={[0.25, 0, 0]}>
      <mesh geometry={band}>
        <Metal color={metal} />
      </mesh>
      <Melee stones={stones} tint={tint} />
    </group>
  );
}

function BandModel({ metal, tint }: Build) {
  const band = useMemo(() => sweep(flat(0.17, 0.06), [0.37, 0.37]), []);
  const stone = useMemo<Stone[]>(() => [{ position: new THREE.Vector3(0, 0.395, 0), facing: UP, scale: 0.05 }], []);
  return (
    <group rotation={[0.35, 0, 0]}>
      <mesh geometry={band}>
        <Metal color={metal} />
      </mesh>
      <Melee stones={stone} tint={tint} />
    </group>
  );
}

function PendantModel({ metal, tint, fancy }: Build) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.42, 0.95, -0.1),
        new THREE.Vector3(-0.3, 0.55, 0),
        new THREE.Vector3(-0.12, 0.22, 0.02),
        new THREE.Vector3(0, 0.12, 0.02),
        new THREE.Vector3(0.12, 0.22, 0.02),
        new THREE.Vector3(0.3, 0.55, 0),
        new THREE.Vector3(0.42, 0.95, -0.1),
      ]),
    [],
  );
  return (
    <group position={[0, -0.32, 0]}>
      <Chain curve={curve} links={80} size={0.012} color={metal} />
      <mesh position={[0, 0.09, 0]}>
        <torusGeometry args={[0.025, 0.007, 8, 20]} />
        <Metal color={metal} />
      </mesh>
      <mesh position={[0, -0.12, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.012, 10, 48]} />
        <Metal color={metal} />
      </mesh>
      <Diamond fancy={fancy} bounces={3} position={[0, -0.12, 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={0.155} tint={tint} />
    </group>
  );
}

function RivieraModel({ metal, tint, fancy }: Build) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        Array.from({ length: 13 }, (_, i) => {
          const a = Math.PI * (0.05 + (i / 12) * 0.9);
          return new THREE.Vector3(-Math.cos(a) * 0.72, 0.55 - Math.sin(a) * 0.82, Math.sin(a) * 0.12);
        }),
      ),
    [],
  );
  const stones = useMemo<Stone[]>(() => {
    const out: Stone[] = [];
    const n = 25;
    for (let i = 0; i < n; i++) {
      const t = 0.14 + (i / (n - 1)) * 0.72;
      if (Math.abs(t - 0.5) < 0.02) continue;
      const grade = 1 - Math.abs(t - 0.5) * 2;
      out.push({ position: curve.getPointAt(t).add(new THREE.Vector3(0, 0, 0.02)), facing: FRONT, scale: 0.028 + grade * 0.03 });
    }
    return out;
  }, [curve]);
  const bottom = curve.getPointAt(0.5);

  return (
    <group position={[0, 0.02, 0]}>
      <Chain curve={curve} links={120} size={0.01} color={metal} />
      <Melee stones={stones} tint={TINTS.white} />
      <mesh position={[bottom.x, bottom.y - 0.13, bottom.z]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.01, 10, 48]} />
        <Metal color={metal} />
      </mesh>
      <Diamond fancy={fancy} bounces={3} position={[bottom.x, bottom.y - 0.13, bottom.z + 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={0.115} tint={tint} />
    </group>
  );
}

function Stud({ metal, tint, fancy, x }: Build & { x: number }) {
  return (
    <group position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <Diamond fancy={fancy} bounces={2} scale={0.2} tint={tint} />
      <mesh position={[0, -0.08, 0]}>
        <torusGeometry args={[0.16, 0.014, 8, 40]} />
        <Metal color={metal} />
      </mesh>
      <Claws radius={0.19} height={0.1} metal={metal} y={-0.01} />
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 8]} />
        <Metal color={metal} />
      </mesh>
    </group>
  );
}

function StudsModel(build: Build) {
  return (
    <group rotation={[0, 0.3, 0]}>
      <Stud {...build} x={-0.3} />
      <Stud {...build} x={0.3} />
    </group>
  );
}

function Drop({ metal, tint, fancy, x }: Build & { x: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.42, 0), new THREE.Vector3(0.01, 0.25, 0), new THREE.Vector3(0, 0.1, 0)]), []);
  const top = useMemo<Stone[]>(() => [{ position: new THREE.Vector3(0, 0.48, 0.02), facing: FRONT, scale: 0.07 }], []);
  return (
    <group position={[x, 0, 0]}>
      <Melee stones={top} tint={TINTS.white} />
      <mesh position={[0, 0.48, -0.01]}>
        <torusGeometry args={[0.07, 0.01, 8, 32]} />
        <Metal color={metal} />
      </mesh>
      <Chain curve={curve} links={12} size={0.014} color={metal} />
      <mesh position={[0, -0.14, -0.01]} scale={[1, 1.35, 1]}>
        <torusGeometry args={[0.16, 0.012, 10, 48]} />
        <Metal color={metal} />
      </mesh>
      <Diamond fancy={fancy} bounces={3} position={[0, -0.14, 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[0.155, 0.155, 0.21]} tint={tint} />
    </group>
  );
}

function DropsModel(build: Build) {
  return (
    <group position={[0, -0.02, 0]}>
      <Drop {...build} x={-0.3} />
      <Drop {...build} x={0.3} />
    </group>
  );
}

function Hoop({ metal, tint, x, yaw }: Build & { x: number; yaw: number }) {
  const hoop = useMemo(() => sweep(flat(0.05, 0.05), [0.3, 0.3]), []);
  const stones = useMemo<Stone[]>(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = -Math.PI * 0.55 + (i / 11) * Math.PI * 1.1;
        const dir = new THREE.Vector3(Math.sin(a), -Math.cos(a), 0);
        return { position: dir.clone().multiplyScalar(0.3).add(new THREE.Vector3(0, 0, 0.03)), facing: FRONT, scale: 0.034 };
      }),
    [],
  );
  return (
    <group position={[x, 0, 0]} rotation={[0, yaw, 0]}>
      <mesh geometry={hoop}>
        <Metal color={metal} />
      </mesh>
      <Melee stones={stones} tint={tint} />
    </group>
  );
}

function HoopsModel(build: Build) {
  return (
    <>
      <Hoop {...build} x={-0.36} yaw={0.45} />
      <Hoop {...build} x={0.36} yaw={-0.45} />
    </>
  );
}

function TennisModel({ metal, tint }: Build) {
  const band = useMemo(() => sweep(flat(0.05, 0.04), [0.55, 0.55]), []);
  const stones = useMemo<Stone[]>(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.sin(a), -Math.cos(a), 0);
        return { position: dir.clone().multiplyScalar(0.555).add(new THREE.Vector3(0, 0, 0.035)), facing: FRONT, scale: 0.04 };
      }),
    [],
  );
  return (
    <group rotation={[-0.9, 0, 0]}>
      <mesh geometry={band}>
        <Metal color={metal} />
      </mesh>
      <Melee stones={stones} tint={tint} />
    </group>
  );
}

function CuffModel({ metal, tint, fancy }: Build) {
  const cuff = useMemo(() => sweep(flat(0.2, 0.07), [0.5, 0.42], Math.PI * 0.25, Math.PI * 1.75), []);
  return (
    <group rotation={[0.45, 0, 0]} position={[0, -0.02, 0]}>
      <mesh geometry={cuff}>
        <Metal color={metal} />
      </mesh>
      <group position={[0, 0.46, 0]}>
        <mesh>
          <cylinderGeometry args={[0.13, 0.1, 0.08, 40]} />
          <Metal color={metal} />
        </mesh>
        <Diamond fancy={fancy} bounces={3} position={[0, 0.07, 0]} scale={0.13} tint={tint} />
      </group>
    </group>
  );
}

function LooseModel({ tint, fancy }: Build) {
  return <Diamond fancy={fancy} bounces={5} rotation={[0.5, 0, 0]} scale={0.5} tint={tint} />;
}

const BUILDERS: Record<Model, (b: Build) => React.JSX.Element> = {
  solitaire: SolitaireModel,
  halo: HaloModel,
  eternity: EternityModel,
  band: BandModel,
  pendant: PendantModel,
  riviera: RivieraModel,
  studs: StudsModel,
  drops: DropsModel,
  hoops: HoopsModel,
  tennis: TennisModel,
  cuff: CuffModel,
  loose: LooseModel,
};

/** Any catalogue piece, centred on the origin and sized to sit inside a unit sphere. */
export function Jewel({
  model,
  metal,
  stone,
  fancy = true,
  ...props
}: { model: Model; metal: string; stone: StoneId; fancy?: boolean } & ThreeElements["group"]) {
  const Build = BUILDERS[model];
  return (
    <group {...props}>
      <Build metal={metal} tint={TINTS[stone]} fancy={fancy} />
    </group>
  );
}
