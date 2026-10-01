"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { MALL, photoUrl, smooth } from "@/lib/journey";

export type MallLook = { yaw: number; pitch: number };
type V3 = [number, number, number];
const GOLD = { color: "#bd9654", metalness: .65, roughness: .3 };

function Block({ at, size, color = "#a4957d", gold = false }: { at: V3; size: V3; color?: string; gold?: boolean }) {
  return <mesh position={at}><boxGeometry args={size} /><meshStandardMaterial {...(gold ? GOLD : { color, roughness: .64 })} /></mesh>;
}
function LightLine({ at, size }: { at: V3; size: V3 }) {
  return <mesh position={at}><boxGeometry args={size} /><meshBasicMaterial color="#ffe1a0" /></mesh>;
}
function Lettering({ text, at, width = 3, yaw = 0 }: { text: string; at: V3; width?: number; yaw?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "42px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#f7dc9f";
    ctx.fillText(text.split("").join(" "), 512, 64, 1000);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={at} rotation={[0, yaw, 0]}><planeGeometry args={[width, width / 8]} /><meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} /></mesh>;
}

/** Real, enclosed architecture bridges the two photographs. The matrix is the
 * inverse of a walking camera pose, matching DepthPhoto's fixed-camera convention.
 * Looking behind reveals the entrance and shopfronts, not a stretched photograph.
 */
export function MallPassage({ progress, look, reduced, onError }: { progress: RefObject<number>; look: RefObject<MallLook>; reduced: boolean; onError: () => void }) {
  const world = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null);
  const destination = useRef<THREE.MeshBasicMaterial>(null);
  const pose = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useEffect(() => {
    let disposed = false;
    let texture: THREE.Texture | undefined;
    new THREE.TextureLoader().load(photoUrl(34), (map) => {
      if (disposed) { map.dispose(); return; }
      texture = map;
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 4;
      if (destination.current) { destination.current.map = map; destination.current.color.set("white"); destination.current.needsUpdate = true; }
    }, undefined, () => { if (!disposed) onError(); });
    return () => { disposed = true; texture?.dispose(); };
  }, [onError]);
  useFrame(() => {
    const group = world.current;
    if (!group) return;
    const p = progress.current;
    group.visible = p >= MALL.enter - .05 && p <= MALL.gone;
    if (!group.visible) return;
    const enter = smooth(MALL.enter, MALL.stop, p);
    const walk = smooth(MALL.stop, MALL.gone, p);
    const z = 10 - enter * 12 - walk * 15;
    const x = Math.sin(walk * Math.PI) * .65;
    const bob = reduced ? 0 : Math.sin((10 - z) * 1.7) * .025 * Math.sin(Math.PI * (enter < 1 ? enter : walk));
    position.set(x, 1.75 + bob + walk * .08, z);
    const free = smooth(.8, .95, p) * (1 - smooth(1.4, 1.6, p));
    const yaw = look.current.yaw * free;
    const pitch = look.current.pitch * free;
    target.set(x - Math.sin(yaw) * 8, position.y + Math.sin(pitch) * 8, z - Math.cos(yaw) * 8);
    pose.lookAt(position, target, up).setPosition(position);
    group.matrix.copy(pose).invert();
    group.matrixWorldNeedsUpdate = true;
    const opening = smooth(MALL.enter, .7, p) * 1.5;
    if (left.current) left.current.rotation.y = -opening;
    if (right.current) right.current.rotation.y = opening;
  });
  return <group ref={world} matrixAutoUpdate={false} visible={false}>
    <ambientLight intensity={.9} color="#ffedce" />
    <hemisphereLight args={["#fff2db", "#536273", 1.1]} />
    <pointLight position={[0, 4.1, -3]} intensity={100} distance={27} color="#ffe3b0" />
    <pointLight position={[0, 4.1, -15]} intensity={90} distance={22} color="#fff1d6" />
    <pointLight position={[0, 4, 9]} intensity={70} distance={18} color="#ffe3b0" />
    <Block at={[0, -.13, -5]} size={[12, .25, 36]} color="#b2a78e" />
    <Block at={[0, 5.4, -5]} size={[12, .2, 36]} color="#463b2c" />
    <Block at={[0, 2.65, 13]} size={[12, 5.5, .2]} color="#786a53" />
    <Block at={[0, 2.65, -23]} size={[12, 5.5, .2]} color="#76664b" />
    {/* Stone tile seams and continuous brass inlays make forward movement readable. */}
    {Array.from({ length: 18 }, (_, i) => <Block key={i} at={[0, .008, 12 - i * 2]} size={[12, .014, .016]} color="#6c604c" />)}
    {[-4, -2, 0, 2, 4].map((x) => <Block key={x} at={[x, .008, -5]} size={[.015, .014, 36]} gold />)}
    {[-1, 1].map((side) => <group key={side}>
      <Block at={[side * 6, 2.65, -5]} size={[.2, 5.5, 36]} color="#7d6b52" />
      <LightLine at={[side * 5.8, 5.12, -5]} size={[.04, .04, 35.8]} />
      <LightLine at={[side * 2.55, .016, -5]} size={[.018, .015, 35.8]} />
      {[7, 0, -7, -14, -21].map((z, index) => <group key={z} position={[side * 5.82, 0, z]} rotation={[0, -side * Math.PI / 2, 0]}>
        <Block at={[0, 2.5, -.1]} size={[5.5, 4.6, .18]} color="#161e28" />
        {[-1, 1].map((edge) => <Block key={edge} at={[edge * 2.7, 2.5, .1]} size={[.1, 4.8, .35]} gold />)}
        <Block at={[0, 4.83, .1]} size={[5.5, .45, .35]} color="#251c12" />
        <Lettering text={index % 2 ? "THE GOLD GALLERY" : "SYLHET PLAZA"} at={[0, 4.83, .29]} width={4.1} />
        <LightLine at={[0, 4.53, .2]} size={[5.3, .035, .09]} />
        {[.65, 2.3].map((y) => <group key={y}>
          <Block at={[0, y, .38]} size={[5.1, .1, .85]} gold />
          {[-1.65, 0, 1.65].map((x) => <group key={x} position={[x, y + .14, .42]}>
            <mesh position={[0, .44, 0]}><cylinderGeometry args={[.2, .44, .88, 24]} /><meshStandardMaterial color="#142f50" roughness={.94} /></mesh>
            <mesh position={[0, .44, .28]} scale={[.75, 1, 1]}><torusGeometry args={[.3, .035, 8, 32]} /><meshStandardMaterial {...GOLD} /></mesh>
          </group>)}
        </group>)}
        <mesh position={[0, 2.5, .88]}><planeGeometry args={[5.2, 4]} /><meshPhysicalMaterial color="#c5d9db" metalness={.25} roughness={.13} transparent opacity={.065} depthWrite={false} /></mesh>
      </group>)}
    </group>)}
    {[8, 1, -6, -13, -20].map((z) => <group key={z}>
      {[-1, 1].map((side) => <group key={side}>
        <Block at={[side * 5.45, 2.6, z]} size={[.28, 5.2, .42]} color="#d5c3a1" />
        <Block at={[side * 5.45, .18, z]} size={[.4, .35, .52]} gold />
      </group>)}
      <Block at={[0, 5.12, z]} size={[11, .3, .42]} color="#d5c3a1" />
      <LightLine at={[0, 4.94, z + .12]} size={[10.6, .025, .04]} />
      <mesh position={[0, 5.02, z - 2]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.2, .035, 8, 48]} /><meshBasicMaterial color="#ffe2a8" /></mesh>
    </group>)}
    {/* The threshold is crossed before the long indoor walk begins. */}
    <group position={[0, 0, 8]}>
      {[-1, 1].map((side) => <group key={side} position={[side * 2, 0, 0]} ref={side < 0 ? left : right}>
        <group position={[-side, 2.1, 0]}>
          <mesh><boxGeometry args={[1.97, 4.2, .05]} /><meshStandardMaterial color="#b3bcc0" transparent opacity={.12} metalness={.4} roughness={.13} depthWrite={false} /></mesh>
          {[-.98, .98].map((x) => <Block key={x} at={[x, 0, 0]} size={[.07, 4.2, .1]} gold />)}
          {[-2.06, 2.06].map((y) => <Block key={y} at={[0, y, 0]} size={[2, .08, .1]} gold />)}
          <Block at={[side * .7, -.1, .15]} size={[.05, .9, .2]} gold />
        </group>
      </group>)}
      <Lettering text="WELCOME TO SYLHET PLAZA" at={[0, 4.65, .1]} width={5} />
    </group>
    <Lettering text="JHUMA JEWELLERS · FOURTH FLOOR" at={[0, 4.82, -22.8]} width={7.6} />
    <mesh position={[0, 2.7, -22.82]}><planeGeometry args={[7.2, 5.4]} /><meshBasicMaterial ref={destination} color="#927b54" toneMapped={false} /></mesh>
    <Lettering text="THE PLAZA" at={[0, 3.6, 12.85]} width={5} yaw={Math.PI} />
  </group>;
}
