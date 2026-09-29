"use client";

import { Environment, Lightformer, MeshRefractionMaterial } from "@react-three/drei";
import { useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { brilliantGeometry } from "@/lib/brilliant";

/** The studio cube map, shared once the Environment has rendered it. */
const EnvContext = createContext<THREE.Texture | null>(null);

export { EnvContext };

export function EnvProvider({ children }: { children: ReactNode }) {
  const scene = useThree((state) => state.scene);
  const [env, setEnv] = useState<THREE.Texture | null>(null);
  useFrame(() => {
    if (!env && scene.environment) setEnv(scene.environment);
  });
  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>;
}

type Tint = { color: string; deep: string };

export const TINTS = {
  white: { color: "#ffffff", deep: "#d9d3ff" },
  violet: { color: "#e2c9ff", deep: "#6a1db8" },
  ice: { color: "#d4e6ff", deep: "#2c56b8" },
  champagne: { color: "#fff0dc", deep: "#b88a4a" },
  /** Saturated blue-violet, for the stone that closes the experience. */
  amethyst: { color: "#9a86ff", deep: "#4b2fd6" },
} satisfies Record<string, Tint>;

export function Diamond({
  fancy,
  tint = TINTS.white,
  bounces = 3,
  ...props
}: { fancy: boolean; tint?: Tint; bounces?: number } & ThreeElements["mesh"]) {
  const env = useContext(EnvContext);
  const geometry = brilliantGeometry();

  return (
    <mesh geometry={geometry} castShadow {...props}>
      {env ? (
        <MeshRefractionMaterial
          envMap={env}
          bounces={fancy ? bounces : Math.min(bounces, 2)}
          ior={2.4}
          fresnel={0.9}
          aberrationStrength={0.02}
          fastChroma
          color={tint.color}
          toneMapped={false}
        />
      ) : (
        <meshPhysicalMaterial
          color={tint.color}
          roughness={0}
          metalness={0}
          transmission={1}
          thickness={1.2}
          ior={2.4}
          dispersion={5}
          specularIntensity={1}
          envMapIntensity={2.6}
          attenuationColor={tint.deep}
          attenuationDistance={2.4}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      )}
    </mesh>
  );
}

/** Soft additive pool of light under the floating stone. */
export function Glow({ color = "#b58cff", size = 1.6, opacity = 0.5, ...props }: { color?: string; size?: number; opacity?: number } & ThreeElements["mesh"]) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} {...props}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

const PLATINUM = { color: "#eceef4", metalness: 1, roughness: 0.12, envMapIntensity: 1.4 };

/** Solitaire: tapered knife-edge band, four-prong head, brilliant set table-up. */
export function Solitaire({ fancy, ...props }: { fancy: boolean } & ThreeElements["group"]) {
  const band = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.05);
    shape.quadraticCurveTo(0.034, 0, 0, 0.05);
    shape.quadraticCurveTo(-0.034, 0, 0, -0.05);
    const path = new THREE.CatmullRomCurve3(
      Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2;
        return new THREE.Vector3(Math.sin(a) * 0.36, -Math.cos(a) * 0.36, 0);
      }),
      true,
    );
    return new THREE.ExtrudeGeometry(shape, { steps: 160, bevelEnabled: false, extrudePath: path });
  }, []);

  const prongs = [0, 1, 2, 3].map((i) => {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    return [Math.cos(a), Math.sin(a)] as const;
  });

  return (
    <group {...props}>
      <mesh geometry={band} castShadow>
        <meshStandardMaterial {...PLATINUM} />
      </mesh>
      <group position={[0, 0.36, 0]}>
        <mesh position={[0, 0.07, 0]}>
          <torusGeometry args={[0.1, 0.011, 10, 40]} />
          <meshStandardMaterial {...PLATINUM} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.01, 10, 32]} />
          <meshStandardMaterial {...PLATINUM} />
        </mesh>
        {prongs.map(([x, z], i) => (
          <mesh key={i} position={[x * 0.1, 0.1, z * 0.1]} rotation={[z * 0.28, 0, -x * 0.28]}>
            <capsuleGeometry args={[0.012, 0.16, 4, 8]} />
            <meshStandardMaterial {...PLATINUM} />
          </mesh>
        ))}
        <Diamond fancy={fancy} bounces={2} position={[0, 0.16, 0]} scale={0.13} />
      </group>
    </group>
  );
}

/** Cable chain: alternating oval links laid along a curve. */
export function Chain({
  curve,
  links = 90,
  size = 0.022,
  color = PLATINUM.color,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  links?: number;
  size?: number;
  color?: string;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const helper = new THREE.Object3D();
    for (let i = 0; i < links; i++) {
      const t = i / (links - 1);
      helper.position.copy(curve.getPointAt(t));
      const tangent = curve.getTangentAt(t);
      helper.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
      helper.rotateOnAxis(new THREE.Vector3(1, 0, 0), i % 2 ? Math.PI / 2 : 0);
      helper.updateMatrix();
      target.setMatrixAt(i, helper.matrix);
    }
    target.instanceMatrix.needsUpdate = true;
  }, [curve, links]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, links]} castShadow>
      <torusGeometry args={[size, size * 0.3, 6, 14]} />
      <meshStandardMaterial {...PLATINUM} color={color} />
    </instancedMesh>
  );
}

/** Pendant necklace laid flat, the chain closing in a soft V at the stone. */
export function LaidNecklace({ fancy, ...props }: { fancy: boolean } & ThreeElements["group"]) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 0, 0.36),
          new THREE.Vector3(0.28, 0, 0.18),
          new THREE.Vector3(0.44, 0, -0.12),
          new THREE.Vector3(0.3, 0, -0.38),
          new THREE.Vector3(0, 0, -0.46),
          new THREE.Vector3(-0.3, 0, -0.38),
          new THREE.Vector3(-0.44, 0, -0.12),
          new THREE.Vector3(-0.28, 0, 0.18),
          new THREE.Vector3(0, 0, 0.36),
        ],
        false,
        "centripetal",
      ),
    [],
  );

  return (
    <group {...props}>
      <Chain curve={curve} links={120} size={0.014} />
      <mesh position={[0, 0.01, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.022, 0.006, 8, 20]} />
        <meshStandardMaterial {...PLATINUM} />
      </mesh>
      <Diamond fancy={fancy} bounces={2} position={[0, 0.045, 0.49]} rotation={[-0.25, 0.4, 0]} scale={0.085} />
    </group>
  );
}

/** Velvet jewelry bust: a lathe profile flattened front to back, wearing a pendant. */
export function Bust({ fancy, ...props }: { fancy: boolean } & ThreeElements["group"]) {
  const lathe = useMemo(() => {
    const profile = [
      [0, 0],
      [0.3, 0],
      [0.32, 0.025],
      [0.3, 0.05],
      [0.1, 0.09],
      [0.06, 0.18],
      [0.07, 0.36],
      [0.2, 0.44],
      [0.4, 0.66],
      [0.53, 0.8],
      [0.56, 0.96],
      [0.52, 1.1],
      [0.42, 1.2],
      [0.22, 1.28],
      [0.13, 1.34],
      [0.115, 1.48],
      [0.12, 1.62],
      [0.14, 1.66],
      [0.1, 1.69],
      [0, 1.7],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(profile, 72);
  }, []);

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.12, 1.4, -0.02),
        new THREE.Vector3(-0.2, 1.3, 0.12),
        new THREE.Vector3(-0.14, 1.16, 0.3),
        new THREE.Vector3(0, 1.08, 0.345),
        new THREE.Vector3(0.14, 1.16, 0.3),
        new THREE.Vector3(0.2, 1.3, 0.12),
        new THREE.Vector3(0.12, 1.4, -0.02),
      ]),
    [],
  );

  return (
    <group {...props}>
      <mesh geometry={lathe} scale={[1, 1, 0.62]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#07050a" roughness={0.95} sheen={0.6} sheenColor="#4a3170" sheenRoughness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.315, 64]} />
        <meshStandardMaterial {...PLATINUM} />
      </mesh>
      <Chain curve={curve} links={70} size={0.011} />
      <Diamond fancy={fancy} bounces={2} position={[0, 1.02, 0.37]} rotation={[Math.PI / 2 - 0.2, 0, 0]} scale={0.075} tint={TINTS.white} />
    </group>
  );
}

/** Offline studio: softboxes and strips baked into a cube map the stones refract. */
export function Studio({ neutral = false, resolution = 512 }: { neutral?: boolean; resolution?: 256 | 512 }) {
  if (neutral) {
    // Product views use a clean white studio so golds read true.
    return (
      <Environment resolution={256} frames={1} environmentIntensity={1}>
        <color attach="background" args={["#0b0a0e"]} />
        <Lightformer form="rect" intensity={8} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[7, 4, 1]} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <Lightformer
              key={i}
              form="rect"
              intensity={i % 2 ? 2.5 : 4.5}
              position={[Math.sin(a) * 6, 1.2, Math.cos(a) * 6]}
              rotation-y={a + Math.PI}
              scale={[0.8, 5, 1]}
              color={i % 3 === 1 ? "#f4efe8" : "#ffffff"}
            />
          );
        })}
        <Lightformer form="rect" intensity={2} position={[0, 1, -6]} scale={[2, 6, 1]} />
        <Lightformer form="ring" intensity={6} position={[2, 3, 5]} scale={1.2} />
        <Lightformer form="rect" intensity={3} position={[0, 0.5, 6]} scale={[6, 1.5, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[6, 6, 1]} color="#2a2630" />
      </Environment>
    );
  }

  // The experience: a black studio with a few narrow, very bright strips. Each facet sees
  // either black or blazing white, never a mid-grey panel, which is what makes a stone
  // look brilliant rather than faded.
  return (
    <Environment resolution={resolution} frames={1} environmentIntensity={1}>
      <color attach="background" args={["#000000"]} />
      {/* narrow ceiling bar and a key strip over the right shoulder */}
      <Lightformer form="rect" intensity={12} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[5, 1.2, 1]} />
      <Lightformer form="rect" intensity={10} position={[4, 3, 4]} rotation-y={-Math.PI / 4} scale={[0.9, 5, 1]} />
      {/* ring of thin strips with black between them, one violet for colour */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <Lightformer
            key={i}
            form="rect"
            intensity={i % 2 ? 6 : 11}
            position={[Math.sin(a) * 7, 1.5, Math.cos(a) * 7]}
            rotation-y={a + Math.PI}
            scale={[i % 2 ? 0.3 : 0.7, 7, 1]}
            color={i === 3 ? "#b89cff" : "#ffffff"}
          />
        );
      })}
      <Lightformer form="ring" intensity={14} position={[-2.5, 3.5, 5]} scale={0.8} />
      <Lightformer form="rect" intensity={0.5} position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[6, 6, 1]} color="#2a1d4a" />
    </Environment>
  );
}
