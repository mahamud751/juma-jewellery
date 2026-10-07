"use client";

import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { BUILDERS, type PieceGeometry } from "@/components/journey/gold";
import { reliefFrom } from "@/components/relief-photo";

/* ───────────────────────── Materials ───────────────────────── */

/* The salon's palette, taken from the photographs of steps 1–6: honey wood in vertical flutes,
   cream lit niches, polished gold, and royal blue velvet. */

/** Vertical flutes: each a rounded slat, lighter at its crown. Tiles across the width. */
export function fluteTexture(slats: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 4;
  const context = canvas.getContext("2d")!;
  const gradient = context.createLinearGradient(0, 0, 64, 0);
  gradient.addColorStop(0, "#4a2a12");
  gradient.addColorStop(0.12, "#8a5426");
  gradient.addColorStop(0.5, "#c58a4c");
  gradient.addColorStop(0.88, "#8a5426");
  gradient.addColorStop(1, "#4a2a12");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 4);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(slats, 1);
  map.anisotropy = 8;
  return map;
}

/** The salon's hexagon jali: honey wood rings on transparent ground. Tiles both ways. */
export function latticeTexture(repeatX: number, repeatY: number) {
  const r = 30;
  const w = Math.sqrt(3) * r;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * 2);
  canvas.height = r * 3 * 2;
  const context = canvas.getContext("2d")!;
  context.strokeStyle = "#9a6230";
  context.lineWidth = 9;
  context.lineJoin = "round";
  for (let row = -1; row <= 4; row++) {
    for (let col = -1; col <= 3; col++) {
      const cx = col * w + (row % 2 ? w / 2 : 0);
      const cy = row * r * 1.5;
      context.beginPath();
      for (let k = 0; k <= 6; k++) {
        const a = Math.PI / 6 + (k * Math.PI) / 3;
        const x = cx + Math.cos(a) * (r - 6);
        const y = cy + Math.sin(a) * (r - 6);
        if (k) context.lineTo(x, y);
        else context.moveTo(x, y);
      }
      context.stroke();
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.anisotropy = 8;
  return map;
}

function makeMaterials() {
  return {
    wood: new THREE.MeshStandardMaterial({ color: "#9a5f2c", roughness: 0.42, metalness: 0.08 }),
    woodDark: new THREE.MeshStandardMaterial({ color: "#5e3415", roughness: 0.4, metalness: 0.08 }),
    gold: new THREE.MeshStandardMaterial({ color: "#e8bd62", roughness: 0.2, metalness: 1, envMapIntensity: 1.4 }),
    velvet: new THREE.MeshPhysicalMaterial({ color: "#0a2596", roughness: 0.95, sheen: 0.35, sheenColor: new THREE.Color("#2a5ee6"), sheenRoughness: 0.5 }),
    cream: new THREE.MeshStandardMaterial({ color: "#efe5d3", roughness: 0.55, metalness: 0.02 }),
    /** The inside of a lit niche: cream, glowing from hidden strips. */
    niche: new THREE.MeshStandardMaterial({ color: "#d9c8aa", emissive: new THREE.Color("#ffd9a0"), emissiveIntensity: 0.14, roughness: 0.75 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#fff6e4", roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.08, envMapIntensity: 1, depthWrite: false, side: THREE.DoubleSide }),
    led: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.85, 1.35), toneMapped: false }),
    curtain: new THREE.MeshPhysicalMaterial({ color: "#0f2580", roughness: 0.92, sheen: 0.7, sheenColor: new THREE.Color("#4a6ee0"), sheenRoughness: 0.45, side: THREE.DoubleSide }),
    ruby: new THREE.MeshPhysicalMaterial({ color: "#a3001c", roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.2, sheen: 0.4, sheenColor: new THREE.Color("#ff4a5e") }),
    taupe: new THREE.MeshPhysicalMaterial({ color: "#6f645c", roughness: 0.95, sheen: 0.4, sheenColor: new THREE.Color("#b8a99c"), sheenRoughness: 0.5 }),
  };
}

let radial: THREE.Texture | null = null;
/** One soft round light texture, shared by every halo and floor pool. */
function radialMap() {
  if (radial) return radial;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.32)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  radial = new THREE.CanvasTexture(canvas);
  return radial;
}

/** Additive light that swells with `open`: `base` when shut, `base + gain` when open. */
export function Halo({ open, base = 0.1, gain = 0.5, size = 2, color = "#ffcf85", flat = false, ...props }: {
  open?: RefObject<number>; base?: number; gain?: number; size?: number; color?: string; flat?: boolean;
} & Omit<React.JSX.IntrinsicElements["mesh"], "ref">) {
  const material = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    if (material.current) material.current.opacity = base + gain * (open?.current ?? 0);
  });
  return (
    <mesh rotation={flat ? [-Math.PI / 2, 0, 0] : [0, 0, 0]} {...props}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial ref={material} map={radialMap()} color={color} transparent opacity={base} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export type Materials = ReturnType<typeof makeMaterials>;
const MaterialsContext = createContext<Materials | null>(null);

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const materials = useMemo(() => makeMaterials(), []);
  useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials]);
  return <MaterialsContext.Provider value={materials}>{children}</MaterialsContext.Provider>;
}

export function useMaterials() {
  const materials = useContext(MaterialsContext);
  if (!materials) throw new Error("useMaterials needs a MaterialsProvider");
  return materials;
}

/* ───────────────────────── Opening ───────────────────────── */

export const ease = (t: number) => t * t * (3 - 2 * t);
export const span = (from: number, to: number, value: number) => ease(Math.min(1, Math.max(0, (value - from) / (to - from))));

/**
 * 0 shut, 1 open. A display opens as the camera settles on its chapter and shuts once it leaves,
 * opening slowly (the reveal) and closing quicker (so a jump past it stays tidy).
 */
export function useOpening(chapter: number, smoothRef: RefObject<number>, reduced: boolean) {
  const open = useRef(0);
  useFrame((_, delta) => {
    const target = Math.abs((smoothRef.current ?? 0) - chapter) < 0.22 ? 1 : 0;
    open.current = reduced ? target : THREE.MathUtils.damp(open.current, target, target ? 1.25 : 2.6, Math.min(delta, 0.05));
  }, -1);
  return open;
}

/* ───────────────────────── Canvas text ───────────────────────── */

export function useTextTexture(lines: { text: string; font: string; color: string; y: number }[], width = 512, height = 128, background?: string) {
  const key = JSON.stringify([lines, width, height, background]);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d")!;
    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    }
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (const line of lines) {
      context.font = line.font;
      context.fillStyle = line.color;
      context.fillText(line.text, width / 2, line.y * height, width * 0.92);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
    // The key stands in for the arrays, which are rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

const BENGALI = "'Noto Sans Bengali', 'Nirmala UI', 'Bangla Sangam MN', 'Vrinda', sans-serif";

/** The brass name plate on the front of a display. */
export function Plaque({ name, bengali, ...props }: { name: string; bengali: string } & Omit<React.JSX.IntrinsicElements["group"], "ref">) {
  const materials = useMaterials();
  const map = useTextTexture([
    { text: name.toUpperCase().split("").join(" "), font: "500 34px Georgia, serif", color: "#2a1a08", y: 0.4 },
    { text: bengali, font: `26px ${BENGALI}`, color: "#4a3110", y: 0.76 },
  ], 512, 128, "#d9b467");
  return (
    <group {...props}>
      <mesh material={materials.gold}>
        <boxGeometry args={[0.56, 0.15, 0.012]} />
      </mesh>
      <mesh position={[0, 0, 0.007]}>
        <planeGeometry args={[0.53, 0.13]} />
        <meshStandardMaterial map={map} metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── The real piece ───────────────────────── */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  #include <common>
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float uOpacity;
  uniform float uBright;
  uniform float uSweep;
  uniform float uGlint;
  uniform float uFeather;
  varying vec2 vUv;
  #include <common>
  #include <fog_pars_fragment>
  void main() {
    vec4 tex = texture2D(map, vUv);
    vec3 col = tex.rgb * uBright;
    // Gold reads as red well above blue; the velvet is the opposite.
    float gold = clamp((tex.r - tex.b) * 3.0, 0.0, 1.0);
    float band = exp(-pow((vUv.x * 0.75 + vUv.y * 0.55 - uSweep) * 6.0, 2.0));
    col += gold * band * uGlint * vec3(1.0, 0.8, 0.46);
    vec2 edge = smoothstep(vec2(0.0), vec2(uFeather), vUv) * smoothstep(vec2(0.0), vec2(uFeather), 1.0 - vUv);
    gl_FragColor = vec4(col, uOpacity * edge.x * edge.y);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

type Loaded = { geometry: THREE.BufferGeometry; texture: THREE.Texture };

/**
 * A salon photograph of the actual piece, bowed into a relief so the gold stands off the velvet.
 * Its edges melt into the case, it brightens as the display opens, and a slow band of light
 * runs across the gold.
 */
export function PiecePhoto({ src, height, open, seed = 0, bright = 1 }: { src: string; height: number; open: RefObject<number>; seed?: number; bright?: number }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    { map: { value: null }, uOpacity: { value: 1 }, uBright: { value: 0.5 }, uSweep: { value: -1 }, uGlint: { value: 0 }, uFeather: { value: 0.07 } },
  ]), []);

  useEffect(() => {
    let alive = true;
    let made: Loaded | null = null;
    new THREE.TextureLoader().load(src, (map) => {
      if (!alive) return map.dispose();
      const image = map.image as HTMLImageElement;
      const aspect = image.width / Math.max(1, image.height);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;
      made = { geometry: reliefFrom(image, height * aspect, height), texture: map };
      setLoaded(made);
    });
    return () => {
      alive = false;
      made?.geometry.dispose();
      made?.texture.dispose();
    };
  }, [src, height]);

  useFrame(({ clock }) => {
    const u = material.current?.uniforms;
    if (!u || !loaded) return;
    const o = open.current ?? 0;
    u.map.value = loaded.texture;
    u.uBright.value = (0.42 + 0.58 * o) * bright;
    u.uGlint.value = 0.95 * o;
    u.uSweep.value = -0.5 + ((clock.elapsedTime * 0.24 + seed * 0.37) % 2.1);
  });

  if (!loaded) return null;
  return (
    <mesh geometry={loaded.geometry}>
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent fog toneMapped={false} />
    </mesh>
  );
}

/* ───────────────────────── The modelled piece ───────────────────────── */

/** Each piece is built once and kept: the same model can sit in two displays, and the hall remounts. */
const built = new Map<number, PieceGeometry>();
function pieceGeometry(model: number) {
  let geometry = built.get(model);
  if (!geometry) built.set(model, (geometry = BUILDERS[model]()));
  return geometry;
}

/**
 * A modelled gold piece on a turntable, as on GRAIR: built when the camera first comes near its
 * display, it turns slowly while the display is open and leans toward the pointer.
 */
export function GoldPiece({ model, height, open, chapter }: { model: number; height: number; open: RefObject<number>; chapter: number }) {
  const m = useMaterials();
  const [geometry, setGeometry] = useState<PieceGeometry | null>(null);
  const turn = useRef<THREE.Group>(null);
  const angle = useRef(chapter * 0.9);

  // Build in idle time, one display after another, so no flight stalls on it.
  useEffect(() => {
    const build = () => setGeometry(pieceGeometry(model));
    if (typeof requestIdleCallback === "undefined") {
      const timer = setTimeout(build, 300 * chapter);
      return () => clearTimeout(timer);
    }
    const id = requestIdleCallback(build, { timeout: 600 * chapter });
    return () => cancelIdleCallback(id);
  }, [model, chapter]);

  useFrame(({ pointer }, delta) => {
    const o = open.current ?? 0;
    if (!geometry && o > 0.001) setGeometry(pieceGeometry(model));
    if (!turn.current) return;
    angle.current += Math.min(delta, 0.05) * 0.38 * o;
    turn.current.rotation.y = angle.current + pointer.x * 0.35 * o;
    turn.current.rotation.x = -pointer.y * 0.12 * o;
  });

  if (!geometry) return null;
  return (
    <group ref={turn} scale={height / geometry.height}>
      <mesh geometry={geometry.gold} material={m.gold} />
      {geometry.stone && <mesh geometry={geometry.stone} material={m.ruby} />}
      {geometry.velvet && <mesh geometry={geometry.velvet} material={m.velvet} />}
    </group>
  );
}
