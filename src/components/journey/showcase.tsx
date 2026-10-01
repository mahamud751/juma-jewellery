"use client";

import { PerspectiveCamera, Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Studio } from "@/components/jewels";
import { DOORS, PIECE_STOPS, smooth } from "@/lib/journey";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { BUILDERS, glintPoints, type PieceGeometry } from "./gold";

export type Spin = { angle: number; velocity: number };
type Props = { progress: RefObject<number>; spin: RefObject<Spin>; reduced: boolean };

const GOLD = new THREE.MeshPhysicalMaterial({ color: "#f6c45c", metalness: 1, roughness: .22, envMapIntensity: 1.7, side: THREE.DoubleSide });
const RUBY = new THREE.MeshPhysicalMaterial({ color: "#a1001c", metalness: 0, roughness: .05, clearcoat: 1, clearcoatRoughness: .02, ior: 1.76, specularIntensity: 1, envMapIntensity: 2.6, emissive: "#2e0006" });
const VELVET = new THREE.MeshPhysicalMaterial({ color: "#061650", roughness: 1, metalness: 0, sheen: 1, sheenColor: new THREE.Color("#3355c0"), sheenRoughness: .45, envMapIntensity: .3 });

/** How tall each creation is drawn, in scene units (busts are cropped below the chest), and its resting angle. */
const PIECE_HEIGHT = [2.85, 2.85, 1.6, 1.75, 1.45];
const PIECE_YAW = [-.25, -.25, .3, 0, .3];

function textTexture(lines: { text: string; font: string; color: string; y: number }[], width = 1024, height = 256, background?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d")!;
  if (background) { context.fillStyle = background; context.fillRect(0, 0, width, height); }
  context.textAlign = "center"; context.textBaseline = "middle";
  for (const line of lines) { context.font = line.font; context.fillStyle = line.color; context.fillText(line.text, width / 2, line.y * height, width * .94); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function radialTexture(stops: [number, string][]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([at, color]) => gradient.addColorStop(at, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ───────────────────────── The doors ───────────────────────── */

const FLOOR = -1.75, OPEN_W = 2.7, OPEN_H = 3.4, LEAF = OPEN_W / 2;

function hexLattice(width: number, height: number, cell: number) {
  const parts: THREE.BufferGeometry[] = [];
  const dx = cell * Math.sqrt(3), dy = cell * 1.5;
  for (let row = 0; row * dy <= height; row++) for (let col = 0; col * dx <= width + dx; col++) {
    const x = col * dx + (row % 2 ? dx / 2 : 0) - width / 2, y = row * dy - height / 2;
    if (Math.abs(x) > width / 2 - cell * .6 || Math.abs(y) > height / 2 - cell * .6) continue;
    const ring = new THREE.TorusGeometry(cell * .92, cell * .07, 4, 6);
    ring.rotateZ(Math.PI / 6);
    ring.translate(x, y, 0);
    parts.push(ring.toNonIndexed());
    ring.dispose();
  }
  return parts;
}

function Doors({ progress }: { progress: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const assets = useMemo(() => {
    const wood = new THREE.MeshStandardMaterial({ color: "#3b2414", roughness: .6, metalness: .05, transparent: true });
    const flute = new THREE.MeshStandardMaterial({ color: "#a06a33", roughness: .42, metalness: .15, transparent: true });
    const brass = new THREE.MeshPhysicalMaterial({ color: "#f0c260", metalness: 1, roughness: .2, envMapIntensity: 1.5, transparent: true });
    const glass = new THREE.MeshPhysicalMaterial({ color: "#e9d9b6", metalness: .3, roughness: .04, transparent: true, opacity: .2, envMapIntensity: 1.8, depthWrite: false });
    glass.userData.alpha = .2;
    const floor = new THREE.MeshStandardMaterial({ color: "#d8cdbd", roughness: .2, metalness: .05, envMapIntensity: 1.1, transparent: true });
    const carpet = new THREE.MeshStandardMaterial({ color: "#8a0f17", roughness: .95, transparent: true });
    const led = new THREE.MeshBasicMaterial({ color: "#ffd99a", transparent: true, toneMapped: false });
    const sign = new THREE.MeshBasicMaterial({ map: textTexture([
      { text: "J H U M A   J E W E L L E R S", font: "500 64px Georgia, serif", color: "#f3d08a", y: .4 },
      { text: "ঝুমা জুয়েলার্স · সিলেট প্লাজা", font: "40px 'Noto Sans Bengali', 'Nirmala UI', 'Bangla Sangam MN', 'Vrinda', sans-serif", color: "#c9a56a", y: .76 },
    ], 1024, 200, "#0d0a08"), transparent: true, toneMapped: false });
    const monogram = new THREE.MeshBasicMaterial({ map: textTexture([{ text: "J", font: "italic 200px Georgia, serif", color: "#f6d48f", y: .53 }], 256, 256), transparent: true, depthWrite: false, toneMapped: false });
    return { wood, flute, brass, glass, floor, carpet, led, sign, monogram };
  }, []);
  // The hexagon jali of the salon's display walls, in gold on the lower glass.
  const latticeGeometry = useMemo(() => {
    const parts = hexLattice(LEAF - .26, 1.25, .085);
    const geometry = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    return geometry;
  }, []);
  useEffect(() => () => {
    latticeGeometry.dispose();
    [assets.wood, assets.flute, assets.brass, assets.glass, assets.floor, assets.carpet, assets.led, assets.sign, assets.monogram].forEach((material) => { (material as THREE.MeshBasicMaterial).map?.dispose(); material.dispose(); });
  }, [assets, latticeGeometry]);
  const glowMap = useMemo(() => radialTexture([[0, "rgba(255,226,170,1)"], [.45, "rgba(255,196,110,.45)"], [1, "rgba(255,180,90,0)"]]), []);
  useEffect(() => () => glowMap.dispose(), [glowMap]);

  useFrame(() => {
    const p = progress.current;
    const visible = p > DOORS.appear[0] && p < DOORS.gone;
    if (group.current) group.current.visible = visible;
    if (!visible) return;
    const shown = smooth(DOORS.appear[0], DOORS.appear[1], p);
    group.current?.traverse((object) => {
      const material = (object as THREE.Mesh).material as THREE.Material | undefined;
      if (material && !material.userData.glow) material.opacity = (material.userData.alpha ?? 1) * shown;
    });
    const open = smooth(DOORS.open[0], DOORS.open[1], p);
    // A short pull before the swing, like a heavy door.
    const angle = open * 1.62 - Math.sin(open * Math.PI) * .04;
    if (left.current) left.current.rotation.y = angle;
    if (right.current) right.current.rotation.y = -angle;
    if (glow.current) glow.current.opacity = shown * (.25 + open * .9) * (1 - smooth(DOORS.walk[1] - .12, DOORS.walk[1], p));
  });

  const box = (key: string, size: [number, number, number], at: [number, number, number], material: THREE.Material) =>
    <mesh key={key} position={at} material={material}><boxGeometry args={size} /></mesh>;

  return <group ref={group} visible={false}>
    {/* Floor, red carpet, wall with fluted wood and LED lines, as in the photographs of the fourth floor. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR, 4]} material={assets.floor}><planeGeometry args={[30, 9]} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR + .006, 4]} material={assets.carpet}><planeGeometry args={[1.9, 8.4]} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} rotation={[-Math.PI / 2, 0, 0]} position={[side * 1, FLOOR + .008, 4]} material={assets.brass}><planeGeometry args={[.05, 8.4]} /></mesh>)}
    {[-1, 1].map((side) => box(`wall${side}`, [9, 9, .3], [side * (OPEN_W / 2 + .3 + 4.5), 2.75, -.2], assets.wood))}
    {box("lintel", [OPEN_W + .6, 5, .3], [0, OPEN_H + FLOOR + .3 + 2.5, -.2], assets.wood)}
    {[-1, 1].map((side) => Array.from({ length: 26 }, (_, i) => <mesh key={`${side}f${i}`} position={[side * (OPEN_W / 2 + .5 + i * .13), 2.75, -.03]} material={assets.flute}><cylinderGeometry args={[.05, .05, 9, 10, 1, false, -Math.PI / 2, Math.PI]} /></mesh>))}
    {[-1, 1].map((side) => box(`led${side}`, [.025, OPEN_H + .3, .02], [side * (OPEN_W / 2 + .38), FLOOR + (OPEN_H + .3) / 2, .02], assets.led))}
    {box("ledTop", [OPEN_W + .78, .025, .02], [0, FLOOR + OPEN_H + .32, .02], assets.led)}
    {/* The gold frame and the sign. */}
    {[-1, 1].map((side) => box(`jamb${side}`, [.2, OPEN_H + .18, .42], [side * (OPEN_W / 2 + .1), FLOOR + (OPEN_H + .18) / 2, -.12], assets.brass))}
    {box("head", [OPEN_W + .4, .2, .42], [0, FLOOR + OPEN_H + .1, -.12], assets.brass)}
    <mesh position={[0, FLOOR + OPEN_H + .58, .02]} material={assets.sign}><planeGeometry args={[2.9, .566]} /></mesh>
    {box("signFrame", [3.0, .64, .04], [0, FLOOR + OPEN_H + .58, -.01], assets.brass)}
    {/* Warm light from the salon, seen through the glass and pouring out as the doors open. */}
    <mesh position={[0, FLOOR + OPEN_H / 2, -1.4]}><planeGeometry args={[6, 6]} /><meshBasicMaterial ref={glow} map={glowMap} userData={{ glow: true }} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
    {/* Two leaves, hinged at the jambs, swinging into the salon. */}
    {[-1, 1].map((side) => <group key={side} ref={side < 0 ? left : right} position={[side * LEAF, FLOOR, -.12]}>
      <group position={[-side * LEAF / 2, OPEN_H / 2, 0]}>
        <mesh material={assets.glass}><boxGeometry args={[LEAF - .12, OPEN_H - .12, .03]} /></mesh>
        {[-1, 1].map((edge) => box(`stile${edge}`, [.09, OPEN_H, .08], [edge * (LEAF / 2 - .045), 0, 0], assets.brass))}
        {[OPEN_H / 2 - .045, -OPEN_H / 2 + .045, -.25, -.31].map((y) => box(`rail${y}`, [LEAF, .08, .08], [0, y, 0], assets.brass))}
        <mesh geometry={latticeGeometry} material={assets.brass} position={[0, -OPEN_H / 2 + .82, .02]} />
        <mesh geometry={latticeGeometry} material={assets.brass} position={[0, -OPEN_H / 2 + .82, -.02]} />
        <mesh position={[0, .45, .02]} rotation={[0, 0, 0]} material={assets.brass}><torusGeometry args={[.3, .025, 10, 64]} /></mesh>
        <mesh position={[0, .45, .025]} material={assets.monogram}><planeGeometry args={[.5, .5]} /></mesh>
        <mesh position={[0, .45, -.025]} rotation={[0, Math.PI, 0]} material={assets.monogram}><planeGeometry args={[.5, .5]} /></mesh>
        {/* Long pull handles by the meeting edge, on both faces. */}
        {[-1, 1].map((face) => <group key={face} position={[side * (LEAF / 2 - .22), -.1, face * .09]}>
          <mesh material={assets.brass}><cylinderGeometry args={[.022, .022, 1.3, 16]} /></mesh>
          {[-.55, .55].map((y) => <mesh key={y} position={[0, y, -face * .04]} rotation={[Math.PI / 2, 0, 0]} material={assets.brass}><cylinderGeometry args={[.012, .012, .08, 8]} /></mesh>)}
        </group>)}
      </group>
    </group>)}
  </group>;
}

/* ───────────────────────── The creations ───────────────────────── */

const glintVertex = /* glsl */ `
  attribute float phase;
  uniform float time, scale, size;
  varying float vStrength;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vec3 eye = normalize(-view.xyz);
    vec3 light = normalize(vec3(-.4, .7, .6));
    float facing = max(dot(reflect(-light, n), eye), 0.0);
    vStrength = pow(facing, 18.0) * (.55 + .45 * sin(time * 2.6 + phase)) * scale;
    gl_PointSize = size * vStrength / -view.z;
    gl_Position = projectionMatrix * view;
  }
`;
const glintFragment = /* glsl */ `
  varying float vStrength;
  void main() {
    vec2 c = gl_PointCoord - .5;
    float star = max(0.0, 1.0 - abs(c.x) * 18.0) * max(0.0, 1.0 - abs(c.y) * 2.2) + max(0.0, 1.0 - abs(c.y) * 18.0) * max(0.0, 1.0 - abs(c.x) * 2.2);
    float core = exp(-dot(c, c) * 90.0);
    gl_FragColor = vec4(vec3(1.0, .93, .78) * (star * .9 + core), (star + core) * min(1.0, vStrength));
  }
`;

function Glints({ geometry, visible }: { geometry: THREE.BufferGeometry; visible: RefObject<number> }) {
  const dpr = useThree((state) => state.viewport.dpr);
  const points = useMemo(() => {
    const { positions, normals, phases } = glintPoints(geometry, 70);
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    buffer.setAttribute("phase", new THREE.BufferAttribute(phases, 1));
    return buffer;
  }, [geometry]);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: glintVertex, fragmentShader: glintFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, scale: { value: 0 }, size: { value: 140 } },
  }), []);
  useEffect(() => () => { points.dispose(); material.dispose(); }, [points, material]);
  const pointsRef = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    const shader = pointsRef.current?.material as THREE.ShaderMaterial | undefined;
    if (!shader) return;
    shader.uniforms.time.value = clock.elapsedTime;
    shader.uniforms.scale.value = visible.current ?? 0;
    shader.uniforms.size.value = 150 * dpr;
  });
  return <points ref={pointsRef} geometry={points} material={material} />;
}

function Creation({ index, piece, progress, spin, reduced }: { index: number; piece: PieceGeometry; progress: RefObject<number>; spin: RefObject<Spin>; reduced: boolean }) {
  const outer = useRef<THREE.Group>(null), turn = useRef<THREE.Group>(null);
  const shown = useRef(0);
  const stop = PIECE_STOPS[index];
  const scale = PIECE_HEIGHT[index] / piece.height;
  const size = useThree((state) => state.size);
  const portrait = size.width / size.height < .8;
  useFrame(({ clock }) => {
    const distance = progress.current - stop;
    const v = 1 - smooth(.22, .5, Math.abs(distance));
    shown.current = v;
    if (!outer.current || !turn.current) return;
    outer.current.visible = v > .001;
    if (!outer.current.visible) return;
    const eased = 1 - (1 - v) ** 3;
    outer.current.scale.setScalar(scale * (portrait ? .82 : 1) * (.55 + .45 * eased));
    outer.current.position.set(portrait ? 0 : 1.05, (portrait ? .42 : .02) - (1 - eased) * .5 * Math.sign(distance || 1), 0);
    // One full turn as you scroll past the creation, plus your own drag and a slow turntable drift.
    turn.current.rotation.y = PIECE_YAW[index] + distance / .9 * Math.PI * 2 + (spin.current?.angle ?? 0) + (reduced ? 0 : Math.sin(clock.elapsedTime * .45) * .32);
    turn.current.rotation.x = Math.sin(clock.elapsedTime * .5) * (reduced ? 0 : .025);
  });
  return <group ref={outer} visible={false}>
    <group ref={turn}>
      <mesh geometry={piece.gold} material={GOLD} />
      {piece.stone && <mesh geometry={piece.stone} material={RUBY} />}
      {piece.velvet && <mesh geometry={piece.velvet} material={VELVET} />}
      <Glints geometry={piece.gold} visible={shown} />
    </group>
  </group>;
}

function Showcase({ progress, spin, reduced }: Props) {
  const pieces = useMemo(() => BUILDERS.map((build) => build()), []);
  useEffect(() => () => pieces.forEach((piece) => { piece.gold.dispose(); piece.stone?.dispose(); piece.velvet?.dispose(); }), [pieces]);
  const halo = useRef<THREE.Mesh>(null);
  const haloMap = useMemo(() => radialTexture([[0, "rgba(255,214,140,.55)"], [.35, "rgba(214,160,80,.18)"], [1, "rgba(120,80,40,0)"]]), []);
  useEffect(() => () => haloMap.dispose(), [haloMap]);
  const dust = useRef<THREE.Group>(null);
  const size = useThree((state) => state.size);
  const portrait = size.width / size.height < .8;
  useFrame(() => {
    const nearest = Math.min(...PIECE_STOPS.map((stop) => Math.abs(progress.current - stop)));
    const v = 1 - smooth(.22, .5, nearest);
    if (halo.current) {
      halo.current.visible = v > .001;
      (halo.current.material as THREE.MeshBasicMaterial).opacity = v;
      halo.current.position.set(portrait ? 0 : 1.05, portrait ? .42 : 0, -1.6);
    }
    if (dust.current) { dust.current.visible = v > .05; dust.current.position.x = portrait ? 0 : 1.05; }
  });
  return <>
    <mesh ref={halo} visible={false}><planeGeometry args={[5.2, 5.2]} /><meshBasicMaterial map={haloMap} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
    <group ref={dust} visible={false}>{!reduced && <Sparkles count={70} scale={[3.2, 3, 2]} size={2.2} speed={.25} opacity={.7} color="#ffd98f" noise={.6} />}</group>
    {pieces.map((piece, index) => <Creation key={index} index={index} piece={piece} progress={progress} spin={spin} reduced={reduced} />)}
  </>;
}

/* ───────────────────────── The layer's own camera ───────────────────────── */

function ForegroundCamera({ progress }: { progress: RefObject<number> }) {
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const size = useThree((state) => state.size);
  useFrame(() => {
    const view = camera.current;
    if (!view) return;
    const aspect = size.width / Math.max(1, size.height);
    const p = progress.current;
    const doors = p < DOORS.gone;
    const fov = doors ? (aspect < .8 ? 62 : 50) : aspect < .8 ? 44 : 32;
    // Far enough back for the whole doorway to fit, then walk through it.
    const start = Math.max(5.2, 1.85 / (Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect));
    const walk = smooth(DOORS.walk[0], DOORS.walk[1], p);
    const z = doors ? start + (-2.2 - start) * walk ** 1.6 : 5.2;
    view.position.set(0, doors ? .3 - walk * .15 : 0, z);
    view.lookAt(0, doors ? .42 - walk * .3 : 0, z - 10);
    if (Math.abs(view.fov - fov) > .01 || view.aspect !== aspect) { view.fov = fov; view.aspect = aspect; view.updateProjectionMatrix(); }
  });
  return <PerspectiveCamera ref={camera} makeDefault near={.05} far={60} />;
}

/** Everything drawn over the photographs: the doors and the five creations. */
export function Foreground({ progress, spin, reduced }: Props) {
  return <>
    <ForegroundCamera progress={progress} />
    <Studio neutral />
    <ambientLight intensity={.35} color="#fff2dc" />
    <directionalLight position={[3, 5, 4]} intensity={2.2} color="#fff0d6" />
    <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#cfe0ff" />
    <Doors progress={progress} />
    <Showcase progress={progress} spin={spin} reduced={reduced} />
  </>;
}
