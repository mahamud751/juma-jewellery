"use client";

import type { ThreeElements } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { plasterFor, plasterTexture, washTexture, type Wash } from "@/lib/plaster";

/**
 * A plaster wall washed by a hidden cove. The wash is emissive, so the room reads as lit
 * along its edges without adding lights to the rig. Planes face +z; rotate to place.
 */
export function WashedWall({
  size,
  wash = "top",
  tint = "#7954cd",
  strength = 1,
  base = "#30243f",
  ...props
}: {
  size: [number, number];
  wash?: Wash;
  tint?: string;
  strength?: number;
  base?: string;
} & ThreeElements["mesh"]) {
  const [width, height] = size;
  const surface = useMemo(() => plasterFor(width, height), [width, height]);

  return (
    <mesh receiveShadow {...props}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={base}
        map={surface}
        bumpMap={surface}
        bumpScale={0.18}
        roughness={0.94}
        metalness={0.04}
        emissive={tint}
        emissiveMap={washTexture(wash)}
        emissiveIntensity={strength}
      />
    </mesh>
  );
}

/** Plaster surface props for boxes and other geometry that is not a WashedWall. */
export function usePlaster(width: number, height: number) {
  return useMemo(() => {
    const surface = plasterFor(width, height);
    return { map: surface, bumpMap: surface, bumpScale: 0.18, roughness: 0.92, metalness: 0.05 };
  }, [width, height]);
}

/** The hidden cove fixture itself: a thin line of light that the bloom picks up. */
export function Cove({ length, color = [1.5, 0.95, 3.4], ...props }: { length: number; color?: [number, number, number] } & ThreeElements["mesh"]) {
  return (
    <mesh {...props}>
      <boxGeometry args={[length, 0.025, 0.025]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

/** A rough standing stone, narrowing toward a flat-ish crown where a jewel can rest. `height` in metres. */
export function Rock({ height = 1.5, width = 0.5, ...props }: { height?: number; width?: number } & ThreeElements["group"]) {
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 24);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const up = (v.y + 1) / 2;
      // Layered bumps and ridges; the same function on every vertex keeps the surface closed.
      const bump =
        Math.sin(v.x * 5.1 + v.y * 2.3) * Math.cos(v.z * 4.7 - v.y * 1.7) * 0.06 +
        Math.sin(v.x * 13 + v.z * 11 + v.y * 7) * 0.022 +
        Math.sin(v.y * 23 + v.x * 17) * Math.cos(v.z * 19) * 0.01;
      v.multiplyScalar(1 + bump);
      const taper = 1 - up * 0.55;
      v.x *= taper;
      v.z *= taper;
      // Flatten the crown so the stone sits level.
      if (v.y > 0.86) v.y = 0.86 + (v.y - 0.86) * 0.25;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  const surface = useMemo(() => {
    const texture = plasterTexture().clone();
    texture.repeat.set(2, 3);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // The icosahedron spans y −1…~0.9; lift it so its foot sits on y = 0 and its crown at `height`.
  const scaleY = height / 1.9;
  return (
    <group {...props}>
      <mesh geometry={geometry} position={[0, scaleY, 0]} scale={[width, scaleY, width * 0.85]} castShadow receiveShadow>
        <meshStandardMaterial color="#4a3d66" map={surface} bumpMap={surface} bumpScale={4} roughness={0.96} metalness={0.02} />
      </mesh>
    </group>
  );
}
