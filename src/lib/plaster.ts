import * as THREE from "three";

/**
 * Procedural plaster: tiling value-noise baked into canvas textures once and shared.
 * `plaster` is the surface (map and bump); the wash maps are greyscale light falloffs
 * used as emissive maps, so a wall looks lit by a hidden cove without spending a light.
 */

const SIZE = 256;

function hash(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Value noise that wraps every `period` cells, so the texture tiles without seams. */
function noise(x: number, y: number, period: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const wrap = (v: number) => ((v % period) + period) % period;
  const a = hash(wrap(x0), wrap(y0), seed);
  const b = hash(wrap(x0 + 1), wrap(y0), seed);
  const c = hash(wrap(x0), wrap(y0 + 1), seed);
  const d = hash(wrap(x0 + 1), wrap(y0 + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Fractal plaster, 0–1: broad trowel blotches, finer mottling and a fine grain. */
function plasterField() {
  const field = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let value = 0;
      let amplitude = 0.55;
      let period = 4;
      for (let octave = 0; octave < 6; octave++) {
        value += noise((x / SIZE) * period, (y / SIZE) * period, period, octave + 1) * amplitude;
        amplitude *= 0.5;
        period *= 2;
      }
      field[y * SIZE + x] = value * 0.9 + hash(x, y, 9) * 0.1;
    }
  }
  return field;
}

let field: Float32Array | null = null;
const cache = new Map<string, THREE.CanvasTexture>();

function paint(width: number, height: number, shade: (u: number, v: number, grain: number) => number) {
  field ??= plasterField();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const grain = field[(y % SIZE) * SIZE + (x % SIZE)];
      // Canvas rows run top-down; v runs bottom-up like UVs.
      const value = Math.max(0, Math.min(1, shade(x / (width - 1), 1 - y / (height - 1), grain)));
      const i = (y * width + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = value * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** The plaster surface. Clone it to set a repeat for a given wall size. */
export function plasterTexture() {
  let texture = cache.get("plaster");
  if (!texture) {
    texture = new THREE.CanvasTexture(paint(SIZE, SIZE, (_u, _v, grain) => 0.45 + grain * 0.55));
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    cache.set("plaster", texture);
  }
  return texture;
}

export type Wash = "top" | "bottom" | "edges";

/**
 * Light falloff across a surface: from its top edge (a ceiling cove), its bottom edge
 * (a floor cove) or all four edges (a ceiling lit from coves around it). Mottled by the
 * plaster so the light reads as grazing a rough wall, and softened toward the corners.
 */
export function washTexture(kind: Wash) {
  let texture = cache.get(kind);
  if (!texture) {
    const corners = (u: number) => 0.55 + 0.45 * Math.sin(Math.PI * u) ** 0.35;
    const shade = (u: number, v: number, grain: number) => {
      // Keep trowel detail visible within the colored light wash.
      const mottle = 0.32 + grain * 0.95;
      if (kind === "edges") {
        const edge = Math.min(u, 1 - u, v, 1 - v);
        return Math.exp(-edge * 9) * mottle;
      }
      const from = kind === "top" ? 1 - v : v;
      return (Math.exp(-from * 2.8) * 0.88 + 0.08) * corners(u) * mottle;
    };
    texture = new THREE.CanvasTexture(paint(SIZE, SIZE * 2, shade));
    texture.colorSpace = THREE.SRGBColorSpace;
    cache.set(kind, texture);
  }
  return texture;
}

/** The plaster texture repeated about once every `tile` metres over a w × h surface. */
export function plasterFor(width: number, height: number, tile = 2.2) {
  const texture = plasterTexture().clone();
  texture.repeat.set(width / tile, height / tile);
  texture.needsUpdate = true;
  return texture;
}
