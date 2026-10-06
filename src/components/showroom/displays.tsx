"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import type { Display } from "@/lib/showroom";
import { Halo, PiecePhoto, Plaque, span, useMaterials, useOpening, useTextTexture } from "./kit";

type Props = { display: Display; chapter: number; smoothRef: RefObject<number>; reduced: boolean };

/** Places a display on its floor point, turned to face the hall. */
function Place({ display, children }: { display: Display; children: ReactNode }) {
  return <group position={[display.at[0], 0, display.at[1]]} rotation={[0, display.yaw, 0]}>{children}</group>;
}

/** The piece's idle life once it is out: a slow sway, and a turn toward the pointer. */
function sway(group: THREE.Group, amount: number, time: number, seed: number, pointer: THREE.Vector2, reduced: boolean) {
  const live = reduced ? 0 : amount;
  group.rotation.y = (Math.sin(time * 0.42 + seed) * 0.12 + pointer.x * 0.22) * live;
  group.rotation.z = Math.sin(time * 0.31 + seed) * 0.015 * live;
}

const Box = ({ size, at, material, rotation }: { size: [number, number, number]; at: [number, number, number]; material: THREE.Material; rotation?: [number, number, number] }) => (
  <mesh position={at} rotation={rotation} material={material}><boxGeometry args={size} /></mesh>
);

/* ───────────── Chapter I: a carved box on a plinth; the lid lifts and the har rises out. ───────────── */

export function JewelBox({ display, chapter, smoothRef, reduced }: Props) {
  const m = useMaterials();
  const open = useOpening(chapter, smoothRef, reduced);
  const lid = useRef<THREE.Group>(null);
  const piece = useRef<THREE.Group>(null);
  const monogram = useTextTexture([{ text: "J", font: "italic 190px Georgia, serif", color: "#f2cf86", y: 0.55 }], 256, 256);

  useFrame(({ clock, pointer }) => {
    const o = open.current;
    if (lid.current) lid.current.rotation.x = -span(0, 0.55, o) * 1.95;
    const rise = span(0.3, 1, o);
    const p = piece.current;
    if (!p) return;
    p.visible = rise > 0.01;
    p.position.y = 0.9 + rise * (display.focusY - 0.9);
    p.scale.setScalar(0.25 + 0.75 * rise);
    sway(p, rise, clock.elapsedTime, 0, pointer, reduced);
  });

  return (
    <Place display={display}>
      <mesh position={[0, 0.3, 0]} material={m.woodDark}><cylinderGeometry args={[0.72, 0.78, 0.6, 64]} /></mesh>
      {[0.6, 0.02].map((y) => <mesh key={y} position={[0, y, 0]} material={m.gold}><cylinderGeometry args={[y > 0.3 ? 0.73 : 0.79, y > 0.3 ? 0.73 : 0.79, 0.03, 64]} /></mesh>)}
      <Box size={[1.1, 0.42, 0.74]} at={[0, 0.81, 0]} material={m.wood} />
      {[-1, 1].map((s) => <Box key={`e${s}`} size={[1.12, 0.025, 0.025]} at={[0, 0.62, s * 0.37]} material={m.gold} />)}
      <mesh position={[0, 1.021, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.velvet}><planeGeometry args={[1.0, 0.64]} /></mesh>
      <Halo open={open} base={0} gain={0.3} size={2.2} position={[0, 1.6, -0.3]} />
      <group ref={lid} position={[0, 1.02, -0.37]}>
        <Box size={[1.12, 0.1, 0.76]} at={[0, 0.05, 0.37]} material={m.wood} />
        <Box size={[1.0, 0.01, 0.64]} at={[0, -0.004, 0.37]} material={m.velvet} />
        <Box size={[1.14, 0.02, 0.03]} at={[0, 0.005, 0.755]} material={m.gold} />
        <mesh position={[0, 0.101, 0.37]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.34, 0.34]} />
          <meshBasicMaterial map={monogram} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.102, 0.37]} rotation={[-Math.PI / 2, 0, 0]} material={m.gold}><ringGeometry args={[0.2, 0.22, 48]} /></mesh>
      </group>
      <group ref={piece} visible={false}>
        {display.src && <PiecePhoto src={display.src} height={display.height} open={open} seed={chapter} />}
      </group>
      {display.plaque && <Plaque name={display.plaque[0]} bengali={display.plaque[1]} position={[0, 0.81, 0.375]} />}
      <Halo open={open} base={0.03} gain={0.12} size={3.2} flat position={[0, 0.01, 0.3]} />
    </Place>
  );
}

/* ───────────── A glass cabinet on a pedestal; the doors swing and the piece comes out to you. ───────────── */

export function Cabinet({ display, chapter, smoothRef, reduced }: Props) {
  const m = useMaterials();
  const open = useOpening(chapter, smoothRef, reduced);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const piece = useRef<THREE.Group>(null);

  useFrame(({ clock, pointer }) => {
    const o = open.current;
    const swing = span(0, 0.6, o) * 1.9;
    if (left.current) left.current.rotation.y = -swing;
    if (right.current) right.current.rotation.y = swing;
    const out = span(0.35, 1, o);
    const p = piece.current;
    if (!p) return;
    p.position.set(0, display.focusY, -0.12 + out * (display.focusZ + 0.12));
    p.scale.setScalar(0.94 + 0.06 * out);
    sway(p, out, clock.elapsedTime, chapter, pointer, reduced);
  });

  const leaf = (side: -1 | 1) => (
    <group key={side} ref={side < 0 ? left : right} position={[side * 0.73, 1.72, 0.33]}>
      <group position={[-side * 0.36, 0, 0]}>
        <mesh material={m.glass}><planeGeometry args={[0.7, 1.66]} /></mesh>
        {[-1, 1].map((e) => <Box key={`v${e}`} size={[0.03, 1.7, 0.03]} at={[e * 0.36, 0, 0]} material={m.gold} />)}
        {[-1, 1].map((e) => <Box key={`h${e}`} size={[0.72, 0.03, 0.03]} at={[0, e * 0.84, 0]} material={m.gold} />)}
        <mesh position={[-side * 0.3, 0, 0.03]} material={m.gold}><sphereGeometry args={[0.022, 16, 12]} /></mesh>
      </group>
    </group>
  );

  return (
    <Place display={display}>
      <Box size={[1.5, 0.85, 0.7]} at={[0, 0.425, 0]} material={m.wood} />
      <Box size={[1.52, 0.03, 0.72]} at={[0, 0.86, 0]} material={m.gold} />
      <Box size={[1.52, 0.05, 0.72]} at={[0, 0.025, 0]} material={m.gold} />
      <Box size={[1.44, 1.7, 0.04]} at={[0, 1.72, -0.31]} material={m.niche} />
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Box key={`${x}${z}`} size={[0.035, 1.7, 0.035]} at={[x * 0.73, 1.72, z * 0.32]} material={m.gold} />))}
      {[-1, 1].map((x) => <mesh key={`g${x}`} position={[x * 0.73, 1.72, 0]} rotation={[0, Math.PI / 2, 0]} material={m.glass}><planeGeometry args={[0.64, 1.7]} /></mesh>)}
      <Box size={[1.6, 0.14, 0.78]} at={[0, 2.64, 0]} material={m.wood} />
      <Box size={[1.64, 0.03, 0.8]} at={[0, 2.56, 0]} material={m.gold} />
      <Box size={[1.66, 0.04, 0.82]} at={[0, 2.72, 0]} material={m.gold} />
      <Box size={[1.3, 0.012, 0.02]} at={[0, 2.54, 0.22]} material={m.led} />
      <Halo open={open} base={0.06} gain={0.28} size={1.9} position={[0, 1.78, -0.28]} />
      {leaf(-1)}
      {leaf(1)}
      <group ref={piece} position={[0, display.focusY, -0.12]}>
        {display.src && <PiecePhoto src={display.src} height={display.height} open={open} seed={chapter} />}
      </group>
      {display.plaque && <Plaque name={display.plaque[0]} bengali={display.plaque[1]} position={[0, 0.55, 0.352]} />}
      <Halo open={open} base={0.03} gain={0.12} size={2.6} flat position={[0, 0.01, 0.9]} />
    </Place>
  );
}

/* ───────────── An arched alcove behind a velvet curtain; the curtain gathers to the sides. ───────────── */

function useCurtainGeometry() {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(0.95, 2.28, 40, 1);
    const position = plane.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      position.setZ(i, Math.sin(x * 46) * 0.03 + Math.sin(x * 17) * 0.012);
    }
    plane.computeVertexNormals();
    return plane;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

export function CurtainAlcove({ display, chapter, smoothRef, reduced }: Props) {
  const m = useMaterials();
  const open = useOpening(chapter, smoothRef, reduced);
  const curtain = useCurtainGeometry();
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const piece = useRef<THREE.Group>(null);

  useFrame(({ clock, pointer }) => {
    const o = open.current;
    const gather = 1 - span(0, 0.6, o) * 0.84;
    left.current?.scale.set(gather, 1, 1);
    right.current?.scale.set(gather, 1, 1);
    const out = span(0.45, 1, o);
    const p = piece.current;
    if (!p) return;
    p.position.set(0, display.focusY, -0.12 + out * (display.focusZ + 0.12));
    sway(p, out, clock.elapsedTime, chapter, pointer, reduced);
  });

  return (
    <Place display={display}>
      <Box size={[1.7, 0.95, 0.6]} at={[0, 0.475, 0]} material={m.wood} />
      <Box size={[1.72, 0.03, 0.62]} at={[0, 0.96, 0]} material={m.gold} />
      <Box size={[1.7, 2.3, 0.05]} at={[0, 2.12, -0.28]} material={m.niche} />
      <mesh position={[0, 3.27, -0.25]} material={m.niche}><circleGeometry args={[0.85, 48, 0, Math.PI]} /></mesh>
      <mesh position={[0, 3.27, -0.15]} material={m.gold}><torusGeometry args={[0.92, 0.045, 12, 64, Math.PI]} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[0.14, 2.4, 0.2]} at={[s * 0.92, 2.1, -0.15]} material={m.wood} />
          <Box size={[0.2, 0.07, 0.24]} at={[s * 0.92, 3.29, -0.15]} material={m.gold} />
          <Box size={[0.2, 0.07, 0.24]} at={[s * 0.92, 0.94, -0.15]} material={m.gold} />
        </group>
      ))}
      <Halo open={open} base={0.06} gain={0.28} size={2.2} position={[0, 1.95, -0.24]} />
      <mesh position={[0, 3.24, 0.12]} rotation={[0, 0, Math.PI / 2]} material={m.gold}><cylinderGeometry args={[0.018, 0.018, 1.96, 12]} /></mesh>
      <group ref={left} position={[-0.95, 0, 0.1]}>
        <mesh geometry={curtain} position={[0.475, 2.1, 0]} material={m.curtain} />
      </group>
      <group ref={right} position={[0.95, 0, 0.1]}>
        <mesh geometry={curtain} position={[-0.475, 2.1, 0]} material={m.curtain} />
      </group>
      <group ref={piece} position={[0, display.focusY, -0.12]}>
        {display.src && <PiecePhoto src={display.src} height={display.height} open={open} seed={chapter} />}
      </group>
      {display.plaque && <Plaque name={display.plaque[0]} bengali={display.plaque[1]} position={[0, 0.6, 0.302]} />}
      <Halo open={open} base={0.03} gain={0.12} size={2.6} flat position={[0, 0.01, 0.9]} />
    </Place>
  );
}

/* ───────────── A column with a glass dome; the dome lifts away and the jhumka steps forward. ───────────── */

export function Dome({ display, chapter, smoothRef, reduced }: Props) {
  const m = useMaterials();
  const open = useOpening(chapter, smoothRef, reduced);
  const glass = useMemo(() => m.glass.clone(), [m]);
  useEffect(() => () => glass.dispose(), [glass]);
  const dome = useRef<THREE.Group>(null);
  const piece = useRef<THREE.Group>(null);
  const rest = 1.26 + display.height / 2 + 0.02;

  useFrame(({ clock, pointer }) => {
    const o = open.current;
    if (dome.current) {
      dome.current.position.y = 1.26 + span(0, 0.65, o) * 1.8;
      dome.current.visible = o < 0.8;
    }
    glass.setValues({ opacity: 0.1 * (1 - span(0.25, 0.75, o)) });
    const out = span(0.4, 1, o);
    const p = piece.current;
    if (!p) return;
    p.position.set(0, rest + out * (display.focusY - rest), out * display.focusZ);
    sway(p, out, clock.elapsedTime, chapter, pointer, reduced);
  });

  return (
    <Place display={display}>
      <Box size={[1.5, 2.3, 0.05]} at={[0, 1.75, -0.48]} material={m.niche} />
      {[-1, 1].map((s) => <Box key={`v${s}`} size={[0.04, 2.34, 0.06]} at={[s * 0.76, 1.75, -0.46]} material={m.gold} />)}
      {[-1, 1].map((s) => <Box key={`h${s}`} size={[1.56, 0.04, 0.06]} at={[0, 1.75 + s * 1.17, -0.46]} material={m.gold} />)}
      <Halo open={open} base={0.06} gain={0.28} size={2} position={[0, 1.75, -0.44]} />
      <mesh position={[0, 0.03, 0]} material={m.gold}><cylinderGeometry args={[0.42, 0.44, 0.06, 48]} /></mesh>
      <mesh position={[0, 0.6, 0]} material={m.wood}><cylinderGeometry args={[0.28, 0.32, 1.1, 48]} /></mesh>
      <mesh position={[0, 1.17, 0]} material={m.gold}><cylinderGeometry args={[0.4, 0.34, 0.06, 48]} /></mesh>
      <mesh position={[0, 1.23, 0]} material={m.velvet}><cylinderGeometry args={[0.36, 0.38, 0.07, 48]} /></mesh>
      <group ref={dome} position={[0, 1.26, 0]}>
        <mesh position={[0, 0.48, 0]} material={glass}><cylinderGeometry args={[0.46, 0.46, 0.96, 48, 1, true]} /></mesh>
        <mesh position={[0, 0.96, 0]} material={glass}><sphereGeometry args={[0.46, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.gold}><torusGeometry args={[0.46, 0.014, 8, 64]} /></mesh>
        <mesh position={[0, 1.44, 0]} material={m.gold}><sphereGeometry args={[0.035, 16, 12]} /></mesh>
      </group>
      <group ref={piece} position={[0, rest, 0]}>
        {display.src && <PiecePhoto src={display.src} height={display.height} open={open} seed={chapter} />}
      </group>
      {display.plaque && <Plaque name={display.plaque[0]} bengali={display.plaque[1]} position={[0, 0.85, 0.32]} />}
      <Halo open={open} base={0.03} gain={0.12} size={2.4} flat position={[0, 0.01, 0.4]} />
    </Place>
  );
}

/**
 * The piece that lies flat inside a drawer or a case, then stands up and comes forward.
 * `from` is where it lies; it ends at the display's focus point.
 */
function useLift(display: Display, chapter: number, reduced: boolean, from: () => [number, number, boolean?], start: number) {
  const piece = useRef<THREE.Group>(null);
  const lift = (o: number, time: number, pointer: THREE.Vector2) => {
    const p = piece.current;
    if (!p) return;
    const up = span(start, 1, o);
    const [y, z, shown = true] = from();
    p.visible = shown;
    p.position.set(0, y + up * (display.focusY - y), z + up * (display.focusZ - z));
    p.rotation.x = -Math.PI / 2 + up * (Math.PI / 2 - 0.1);
    p.scale.setScalar(0.84 + 0.16 * up);
    const tilt = p.rotation.x;
    sway(p, up, time, chapter, pointer, reduced);
    p.rotation.x = tilt;
  };
  return { piece, lift };
}

/* ───────────── The ring counter; a velvet drawer slides out and the tray stands up. ───────────── */

export function Drawer({ display, chapter, smoothRef, reduced }: Props) {
  const m = useMaterials();
  const open = useOpening(chapter, smoothRef, reduced);
  const drawer = useRef<THREE.Group>(null);
  const slide = useRef(0);
  const { piece, lift } = useLift(display, chapter, reduced, () => [0.9, slide.current, slide.current > 0.05], 0.42);

  useFrame(({ clock, pointer }) => {
    const o = open.current;
    slide.current = span(0, 0.55, o) * 0.62;
    if (drawer.current) drawer.current.position.z = slide.current;
    lift(o, clock.elapsedTime, pointer);
  });

  return (
    <Place display={display}>
      <Box size={[2.1, 0.98, 0.9]} at={[0, 0.49, -0.02]} material={m.wood} />
      <Box size={[2.12, 0.04, 0.92]} at={[0, 0.02, -0.02]} material={m.gold} />
      <Box size={[2.14, 0.03, 0.94]} at={[0, 0.995, -0.02]} material={m.gold} />
      <mesh position={[0, 1.02, -0.02]} rotation={[-Math.PI / 2, 0, 0]} material={m.glass}><planeGeometry args={[2.0, 0.84]} /></mesh>
      <group ref={drawer}>
        <Box size={[1.7, 0.06, 0.82]} at={[0, 0.86, 0.04]} material={m.velvet} />
        <Box size={[1.82, 0.2, 0.04]} at={[0, 0.84, 0.46]} material={m.woodDark} />
        <Box size={[0.5, 0.025, 0.04]} at={[0, 0.84, 0.5]} material={m.gold} />
        <Halo open={open} base={0} gain={0.55} size={1.8} flat position={[0, 0.9, 0.05]} />
      </group>
      <group ref={piece} visible={false}>
        {display.src && <PiecePhoto src={display.src} height={display.height} open={open} seed={chapter} />}
      </group>
      {display.plaque && <Plaque name={display.plaque[0]} bengali={display.plaque[1]} position={[0, 0.42, 0.432]} />}
      <Box size={[2.2, 2.4, 0.05]} at={[0, 2.25, -0.5]} material={m.niche} />
      <Box size={[2.2, 0.05, 0.08]} at={[0, 3.45, -0.48]} material={m.gold} />
      <Halo open={open} base={0.06} gain={0.28} size={2.6} position={[0, 1.8, -0.46]} />
      <Halo open={open} base={0.03} gain={0.12} size={2.8} flat position={[0, 0.01, 1.1]} />
    </Place>
  );
}

/* ───────────── A table case; the glass lid tips back and the earring tray rises. ───────────── */

export function TableCase({ display, chapter, smoothRef, reduced }: Props) {
  const m = useMaterials();
  const open = useOpening(chapter, smoothRef, reduced);
  const lid = useRef<THREE.Group>(null);
  const { piece, lift } = useLift(display, chapter, reduced, () => [0.92, 0], 0.3);

  useFrame(({ clock, pointer }) => {
    const o = open.current;
    if (lid.current) lid.current.rotation.x = -span(0, 0.5, o) * 1.25;
    lift(o, clock.elapsedTime, pointer);
  });

  return (
    <Place display={display}>
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Box key={`${x}${z}`} size={[0.06, 0.74, 0.06]} at={[x * 0.72, 0.37, z * 0.38]} material={m.woodDark} />))}
      <Box size={[1.56, 0.12, 0.86]} at={[0, 0.78, 0]} material={m.wood} />
      <Box size={[1.58, 0.025, 0.88]} at={[0, 0.72, 0]} material={m.gold} />
      <Box size={[1.5, 0.04, 0.8]} at={[0, 0.86, 0]} material={m.velvet} />
      {[-1, 1].map((z) => <mesh key={`f${z}`} position={[0, 1.03, z * 0.4]} material={m.glass}><planeGeometry args={[1.5, 0.3]} /></mesh>)}
      {[-1, 1].map((x) => <mesh key={`s${x}`} position={[x * 0.75, 1.03, 0]} rotation={[0, Math.PI / 2, 0]} material={m.glass}><planeGeometry args={[0.8, 0.3]} /></mesh>)}
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Box key={`p${x}${z}`} size={[0.025, 0.3, 0.025]} at={[x * 0.75, 1.03, z * 0.4]} material={m.gold} />))}
      <group ref={lid} position={[0, 1.18, -0.4]}>
        <mesh position={[0, 0, 0.4]} rotation={[-Math.PI / 2, 0, 0]} material={m.glass}><planeGeometry args={[1.5, 0.8]} /></mesh>
        {[-1, 1].map((x) => <Box key={`lx${x}`} size={[0.025, 0.025, 0.8]} at={[x * 0.75, 0, 0.4]} material={m.gold} />)}
        {[0, 0.8].map((z) => <Box key={`lz${z}`} size={[1.52, 0.025, 0.025]} at={[0, 0, z]} material={m.gold} />)}
      </group>
      <group ref={piece}>
        {display.src && <PiecePhoto src={display.src} height={display.height} open={open} seed={chapter} />}
      </group>
      {display.plaque && <Plaque name={display.plaque[0]} bengali={display.plaque[1]} position={[0, 0.78, 0.432]} />}
      <Box size={[1.9, 2.4, 0.05]} at={[0, 2.1, -0.52]} material={m.niche} />
      <mesh position={[0, 3.3, -0.5]} material={m.gold}><torusGeometry args={[0.95, 0.03, 10, 64, Math.PI]} /></mesh>
      <Halo open={open} base={0.06} gain={0.28} size={2.4} position={[0, 1.7, -0.48]} />
      <Halo open={open} base={0.03} gain={0.12} size={2.6} flat position={[0, 0.01, 0.8]} />
    </Place>
  );
}

/* ───────────── The private viewing: settee, table, chandelier, and a gift box that opens. ───────────── */

export function Lounge({ display, chapter, smoothRef, reduced }: Props) {
  const m = useMaterials();
  const open = useOpening(chapter, smoothRef, reduced);
  const lamps = useMemo(() => m.led.clone(), [m]);
  useEffect(() => () => lamps.dispose(), [lamps]);
  const lid = useRef<THREE.Group>(null);
  const chandelier = useRef<THREE.Group>(null);
  const logo = useLogoTexture();

  useFrame(({ clock }, delta) => {
    const o = open.current;
    const glow = 0.22 + 0.2 * o;
    lamps.color.setRGB(2.4 * glow, 1.75 * glow, 0.95 * glow);
    if (lid.current) lid.current.rotation.x = -span(0.2, 0.8, o) * 1.7;
    if (chandelier.current && !reduced) chandelier.current.rotation.y += delta * 0.08;
    if (chandelier.current) chandelier.current.position.y = 3.35 + Math.sin(clock.elapsedTime * 0.5) * 0.01;
  });

  return (
    <Place display={display}>
      {/* the round Jhuma sign on the fluted wall, as at the salon */}
      <mesh position={[0, 2.35, -2.86]} material={m.gold}><torusGeometry args={[0.92, 0.05, 16, 96]} /></mesh>
      <mesh position={[0, 2.35, -2.835]}><circleGeometry args={[0.88, 96]} /><meshBasicMaterial map={logo} toneMapped={false} /></mesh>
      <Halo open={open} base={0.08} gain={0.1} size={3} position={[0, 2.35, -2.88]} color="#ffd690" />
      {/* settee */}
      <group position={[0, 0, -1.55]}>
        <Box size={[2.4, 0.3, 0.86]} at={[0, 0.3, 0]} material={m.taupe} />
        <Box size={[2.3, 0.12, 0.8]} at={[0, 0.5, 0.02]} material={m.taupe} />
        <Box size={[2.4, 0.72, 0.18]} at={[0, 0.8, -0.36]} material={m.taupe} />
        <Box size={[2.44, 0.04, 0.22]} at={[0, 1.17, -0.36]} material={m.gold} />
        {[-1, 1].map((s) => <Box key={`a${s}`} size={[0.18, 0.62, 0.86]} at={[s * 1.25, 0.46, 0]} material={m.taupe} />)}
        {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Box key={`l${x}${z}`} size={[0.05, 0.16, 0.05]} at={[x * 1.15, 0.08, z * 0.36]} material={m.gold} />))}
      </group>
      {/* table and the gift box */}
      <group position={[0, 0, -0.1]}>
        <mesh position={[0, 0.03, 0]} material={m.gold}><cylinderGeometry args={[0.3, 0.32, 0.04, 48]} /></mesh>
        <mesh position={[0, 0.28, 0]} material={m.gold}><cylinderGeometry args={[0.05, 0.07, 0.5, 24]} /></mesh>
        <mesh position={[0, 0.55, 0]} material={m.wood}><cylinderGeometry args={[0.62, 0.62, 0.05, 64]} /></mesh>
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.gold}><torusGeometry args={[0.62, 0.016, 8, 64]} /></mesh>
        <Box size={[0.32, 0.16, 0.24]} at={[0, 0.66, 0]} material={m.velvet} />
        <group ref={lid} position={[0, 0.74, -0.12]}>
          <Box size={[0.34, 0.06, 0.26]} at={[0, 0.03, 0.12]} material={m.velvet} />
          <Box size={[0.35, 0.012, 0.03]} at={[0, 0.03, 0.12]} material={m.gold} />
        </group>
        <Halo open={open} base={0} gain={0.9} size={1} position={[0, 0.9, 0]} />
      </group>
      {/* floor lamps */}
      {[-1, 1].map((s) => (
        <group key={`fl${s}`} position={[s * 1.75, 0, -1.6]}>
          <mesh position={[0, 0.85, 0]} material={m.gold}><cylinderGeometry args={[0.018, 0.018, 1.7, 10]} /></mesh>
          <mesh position={[0, 0.02, 0]} material={m.gold}><cylinderGeometry args={[0.16, 0.18, 0.04, 32]} /></mesh>
          <mesh position={[0, 1.75, 0]} material={lamps}><cylinderGeometry args={[0.16, 0.24, 0.3, 32, 1, true]} /></mesh>
          <Halo open={open} base={0.12} gain={0.2} size={1.4} position={[0, 1.75, 0.05]} />
        </group>
      ))}
      {/* chandelier */}
      <mesh position={[0, 3.9, -0.6]} material={m.gold}><cylinderGeometry args={[0.012, 0.012, 1, 8]} /></mesh>
      <group ref={chandelier} position={[0, 3.35, -0.6]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.gold}><torusGeometry args={[0.7, 0.02, 10, 96]} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} material={m.gold}><torusGeometry args={[0.42, 0.016, 10, 64]} /></mesh>
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return <mesh key={i} position={[Math.cos(a) * 0.7, 0.05, Math.sin(a) * 0.7]} material={lamps}><sphereGeometry args={[0.04, 12, 8]} /></mesh>;
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.2;
          return <mesh key={`d${i}`} position={[Math.cos(a) * 0.42, -0.4, Math.sin(a) * 0.42]} material={m.gold}><octahedronGeometry args={[0.04]} /></mesh>;
        })}
        <mesh position={[0, -0.55, 0]} material={lamps}><sphereGeometry args={[0.06, 16, 12]} /></mesh>
        <Halo open={open} base={0.25} gain={0.5} size={3} position={[0, 0, 0.1]} />
      </group>
      <Halo open={open} base={0.03} gain={0.1} size={5} flat position={[0, 0.01, -0.4]} />
    </Place>
  );
}

/** The Jhuma roundel: interlaced J J over the name, gold on lit cream. */
function useLogoTexture() {
  const texture = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const c = canvas.getContext("2d")!;
    const glow = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    glow.addColorStop(0, "#fffaf0");
    glow.addColorStop(1, "#efe2c8");
    c.fillStyle = glow;
    c.fillRect(0, 0, size, size);
    const gold = c.createLinearGradient(0, 200, 0, 820);
    gold.addColorStop(0, "#d8a64e");
    gold.addColorStop(0.5, "#8a5a1c");
    gold.addColorStop(1, "#c08a3a");
    c.fillStyle = gold;
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    c.font = "italic 330px Georgia, 'Times New Roman', serif";
    c.fillText("J", size / 2 - 70, 560);
    c.fillText("J", size / 2 + 70, 560);
    c.font = "600 150px Georgia, 'Times New Roman', serif";
    c.fillText("JHUMA", size / 2, 735);
    c.font = "500 66px Georgia, 'Times New Roman', serif";
    c.fillText("J E W E L L E R S", size / 2, 830);
    c.fillRect(size / 2 - 220, 760, 440, 3);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

const BY_OPENING = { box: JewelBox, cabinet: Cabinet, curtain: CurtainAlcove, dome: Dome, drawer: Drawer, case: TableCase, lounge: Lounge } as const;

export function DisplayFor(props: Props) {
  const Component = BY_OPENING[props.display.opening];
  return <Component {...props} />;
}
