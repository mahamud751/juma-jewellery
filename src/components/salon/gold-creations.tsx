"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { DISPLAY_POSITIONS, type SalonVector } from "@/lib/salon";

export type LookState = { yaw: number; pitch: number };

/** Solid, closed geometry inspired by the supplied gold displays. Back faces and
 * clasps are designed here, not inferred as an exact scan of the photographed pieces.
 * Merge the ornamental parts into one draw call per creation for mobile rendering.
 */
function creationGeometry(kind: number) {
  const parts: THREE.BufferGeometry[] = [];
  const add = (geo: THREE.BufferGeometry, p: SalonVector, scale: SalonVector = [1, 1, 1], rotation: SalonVector = [0, 0, 0]) => {
    geo.scale(...scale);
    geo.rotateX(rotation[0]); geo.rotateY(rotation[1]); geo.rotateZ(rotation[2]);
    geo.translate(...p);
    parts.push(geo);
  };
  const bead = (p: SalonVector, radius = .025) => add(new THREE.SphereGeometry(radius, 8, 6), p);
  const ring = (p: SalonVector, radius: number, tube = .013, scale: SalonVector = [1, 1, 1], rot: SalonVector = [0, 0, 0]) => add(new THREE.TorusGeometry(radius, tube, 6, 16), p, scale, rot);
  const flower = (x: number, y: number, z: number, size: number) => {
    bead([x, y, z], size * .23);
    ring([x, y, z], size * .28, .013);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      ring([x + Math.sin(a) * size * .53, y + Math.cos(a) * size * .53, z], size * .27, .011, [.58, 1, 1], [0, 0, -a]);
      bead([x + Math.sin(a) * size * .9, y + Math.cos(a) * size * .9, z], .018);
    }
  };
  const tassel = (x: number, y: number, z: number, length: number) => {
    add(new THREE.CylinderGeometry(.011, .011, length, 6), [x, y - length / 2, z]);
    add(new THREE.SphereGeometry(.027, 8, 6), [x, y - length, z], [1, 1.6, 1]);
  };
  if (kind < 2) {
    for (let i = 0; i < 108; i++) {
      const a = i / 108 * Math.PI * 2;
      const x = Math.sin(a) * .57, y = Math.cos(a) * .72 + .25;
      const z = Math.sin(a) ** 2 * .13;
      ring([x, y, z], .029, .010, [1, 1.25, 1], [i % 2 ? .8 : -.35, 0, -a]);
      if (kind === 1 && i > 32 && i < 78 && i % 5 === 0) {
        flower(x * 1.16, y - .04, z + .025, .09);
        tassel(x * 1.16, y - .13, z + .02, .075);
      }
    }
    // A modeled clasp and back plate remain visible when the piece is turned.
    add(new THREE.BoxGeometry(.09, .05, .045), [0, .99, 0]);
    ring([0, -.5, .015], .05, .016, [.65, 1, 1]);
    flower(0, -.75, .04, kind === 0 ? .26 : .22);
    add(new THREE.SphereGeometry(.19, 24, 12), [0, -.75, 0], [1, 1, .17]);
    for (let i = -4; i <= 4; i++) tassel(i * .043, -.88, .02, .22 - Math.abs(i) * .025);
    if (kind === 0) {
      for (let i = 0; i < 32; i++) {
        const a = i / 32 * Math.PI * 2;
        bead([Math.sin(a) * .23, -.75 + Math.cos(a) * .23, .05], .014);
      }
    }
  } else {
    for (const x of [-.4, .4]) {
      flower(x, .62, 0, .16);
      ring([x, .35, 0], .085, .016, [.7, 1, 1]);
      flower(x, .02, 0, .26);
      add(new THREE.SphereGeometry(.22, 24, 16), [x, -.35, 0], [1, .65, .6]);
      for (let i = -3; i <= 3; i++) tassel(x + i * .065, -.43, .04, .2 - Math.abs(i) * .016);
      // Full hook on the back, visible in the 360-degree product view.
      ring([x, .65, -.10], .075, .012, [.6, 1, 1], [0, Math.PI / 2, 0]);
    }
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  merged.computeBoundingSphere();
  return merged;
}

function Creation({ index, active, look, progress, reduced }: { index: number; active: number; look: RefObject<LookState>; progress: RefObject<number>; reduced: boolean }) {
  const geometry = useMemo(() => creationGeometry(index), [index]);
  const group = useRef<THREE.Group>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (!group.current) return;
    const featured = active === index + 4;
    group.current.rotation.y = featured ? look.current.yaw : 0;
    group.current.rotation.x = featured ? look.current.pitch : 0;
    // A deliberate quarter turn while arriving reveals the real thickness of the gold.
    if (!reduced && featured) group.current.rotation.y += (1 - THREE.MathUtils.smoothstep(progress.current, active - .65, active)) * -.7;
  });
  return <group position={DISPLAY_POSITIONS[index]}>
    <group ref={group}>
      <mesh geometry={geometry} castShadow><meshStandardMaterial color="#eac16c" metalness={1} roughness={.23} envMapIntensity={1.35} /></mesh>
    </group>
  </group>;
}

export function GoldCreations(props: { active: number; look: RefObject<LookState>; progress: RefObject<number>; reduced: boolean }) {
  return <>{DISPLAY_POSITIONS.map((_, index) => <Creation key={index} index={index} {...props} />)}</>;
}
