"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/** Horizontal then vertical max or min. A wide window stays cheap. */
function spread(source: Float32Array, width: number, height: number, radius: number, keepMax: boolean) {
  const tmp = new Float32Array(source.length);
  const out = new Float32Array(source.length);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      let value = keepMax ? 0 : 1;
      for (let xx = x0; xx <= x1; xx++) {
        const sample = source[row + xx];
        if (keepMax ? sample > value : sample < value) value = sample;
      }
      tmp[row + x] = value;
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(height - 1, y + radius);
      let value = keepMax ? 0 : 1;
      for (let yy = y0; yy <= y1; yy++) {
        const sample = tmp[yy * width + x];
        if (keepMax ? sample > value : sample < value) value = sample;
      }
      out[y * width + x] = value;
    }
  }
  return out;
}

/**
 * Components that touch the frame are the wall or the gilt case.
 * On a warm wall every one of those goes. On velvet, only a component big
 * enough to be the tray edge goes, so a ring clipped by the photo can stay.
 */
function dropEdgeComponents(mask: Float32Array, width: number, height: number, minFraction: number) {
  const count = mask.length;
  const seen = new Uint8Array(count);
  const stack: number[] = [];
  const members: number[] = [];
  const limit = count * minFraction;
  for (let start = 0; start < count; start++) {
    if (seen[start] || mask[start] < 0.5) continue;
    members.length = 0;
    stack.push(start);
    seen[start] = 1;
    let touches = false;
    while (stack.length) {
      const index = stack.pop()!;
      members.push(index);
      const x = index % width;
      const y = (index / width) | 0;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touches = true;
      if (x > 0 && !seen[index - 1] && mask[index - 1] >= 0.5) { seen[index - 1] = 1; stack.push(index - 1); }
      if (x + 1 < width && !seen[index + 1] && mask[index + 1] >= 0.5) { seen[index + 1] = 1; stack.push(index + 1); }
      if (y > 0 && !seen[index - width] && mask[index - width] >= 0.5) { seen[index - width] = 1; stack.push(index - width); }
      if (y + 1 < height && !seen[index + width] && mask[index + width] >= 0.5) { seen[index + width] = 1; stack.push(index + width); }
    }
    if (touches && members.length > limit) for (const index of members) mask[index] = 0;
  }
}

/**
 * A tray of small rings is dozens of pieces. Keeping every one, including the
 * blurred ones at the edge, reads as scraps. A necklace is one large piece and
 * is left whole.
 */
function keepPrincipalPieces(mask: Float32Array, width: number, height: number) {
  const count = mask.length;
  const seen = new Uint8Array(count);
  const stack: number[] = [];
  const groups: number[][] = [];
  for (let start = 0; start < count; start++) {
    if (seen[start] || mask[start] < 0.5) continue;
    const members: number[] = [];
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const index = stack.pop()!;
      members.push(index);
      const x = index % width;
      const y = (index / width) | 0;
      if (x > 0 && !seen[index - 1] && mask[index - 1] >= 0.5) { seen[index - 1] = 1; stack.push(index - 1); }
      if (x + 1 < width && !seen[index + 1] && mask[index + 1] >= 0.5) { seen[index + 1] = 1; stack.push(index + 1); }
      if (y > 0 && !seen[index - width] && mask[index - width] >= 0.5) { seen[index - width] = 1; stack.push(index - width); }
      if (y + 1 < height && !seen[index + width] && mask[index + width] >= 0.5) { seen[index + width] = 1; stack.push(index + width); }
    }
    groups.push(members);
  }
  if (groups.length < 12) return;
  const largest = groups.reduce((max, group) => Math.max(max, group.length), 0);
  if (largest > count * 0.02) return;
  groups.sort((a, b) => b.length - a.length);
  const keep = new Set(groups.slice(0, 8).flat());
  for (let index = 0; index < count; index++) if (mask[index] >= 0.5 && !keep.has(index)) mask[index] = 0;
}

/** Specks left on the velvet after the wall is gone. */
function dropSmallComponents(mask: Float32Array, width: number, height: number) {
  const count = mask.length;
  const seen = new Uint8Array(count);
  const stack: number[] = [];
  const members: number[] = [];
  const min = Math.max(18, count * 0.00003);
  for (let start = 0; start < count; start++) {
    if (seen[start] || mask[start] < 0.5) continue;
    members.length = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const index = stack.pop()!;
      members.push(index);
      const x = index % width;
      const y = (index / width) | 0;
      if (x > 0 && !seen[index - 1] && mask[index - 1] >= 0.5) { seen[index - 1] = 1; stack.push(index - 1); }
      if (x + 1 < width && !seen[index + 1] && mask[index + 1] >= 0.5) { seen[index + 1] = 1; stack.push(index + 1); }
      if (y > 0 && !seen[index - width] && mask[index - width] >= 0.5) { seen[index - width] = 1; stack.push(index - width); }
      if (y + 1 < height && !seen[index + width] && mask[index + width] >= 0.5) { seen[index + width] = 1; stack.push(index + width); }
    }
    if (members.length < min) for (const index of members) mask[index] = 0;
  }
}

/** Velvet showing through a closed outline becomes part of the piece. Gaps that open outward stay clear. */
function fillHoles(mask: Float32Array, width: number, height: number) {
  const outside = new Uint8Array(mask.length);
  const stack: number[] = [];
  const push = (index: number) => {
    if (outside[index] || mask[index] >= 0.5) return;
    outside[index] = 1;
    stack.push(index);
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (stack.length) {
    const index = stack.pop()!;
    const x = index % width;
    const y = (index / width) | 0;
    if (x > 0) push(index - 1);
    if (x + 1 < width) push(index + 1);
    if (y > 0) push(index - width);
    if (y + 1 < height) push(index + width);
  }
  for (let index = 0; index < mask.length; index++) if (!outside[index]) mask[index] = 1;
}

/**
 * Lifts the gold out of the salon photograph. Velvet, walls, wood and tags go
 * transparent, and the frame tightens around the jewellery that remains.
 * Returns null when the picture is not a piece on a ground we can separate.
 */
function isolateGold(image: HTMLImageElement) {
  const source = document.createElement("canvas");
  source.width = image.width;
  source.height = image.height;
  const context = source.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0);
  const frame = context.getImageData(0, 0, source.width, source.height);
  const pixels = frame.data;
  const width = source.width;
  const height = source.height;
  const count = width * height;
  let border = 0;
  let warmBorder = 0;
  const considerBorder = (index: number) => {
    border++;
    const red = pixels[index * 4] / 255;
    const green = pixels[index * 4 + 1] / 255;
    const blue = pixels[index * 4 + 2] / 255;
    if (Math.min(red, green) - blue > 0.08 && red > blue + 0.05) warmBorder++;
  };
  for (let x = 0; x < width; x += 3) {
    considerBorder(x);
    considerBorder((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 3) {
    considerBorder(y * width);
    considerBorder(y * width + width - 1);
  }
  const wallPhoto = border > 0 && warmBorder / border > 0.4;
  const score = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const red = pixels[i * 4] / 255;
    const green = pixels[i * 4 + 1] / 255;
    const blue = pixels[i * 4 + 2] / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const sat = max === 0 ? 0 : (max - min) / max;
    const yellow = Math.min(red, green) - blue;
    const light = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const balance = green / Math.max(0.001, red);
    if (blue > red + 0.04 && yellow < 0.05) continue;
    if (light > 0.86 && sat < 0.16) continue;
    // A warm border means the piece is photographed against the salon wall.
    // Only confident metal is kept there, or the wall grows into the necklace
    // and both are thrown away. On blue velvet the quieter links can stay.
    const brightMetal = wallPhoto
      ? yellow > 0.3 && sat > 0.45 && balance > 0.62
      : yellow > 0.16 && sat > 0.28 && red > blue + 0.08 && balance > 0.45;
    const shadowMetal = wallPhoto
      ? yellow > 0.16 && sat > 0.72 && balance > 0.62 && light < 0.55 && light > 0.12
      : yellow > 0.08 && sat > 0.42 && red > blue + 0.05 && light > 0.08 && light < 0.75 && balance > 0.4;
    if (brightMetal || shadowMetal) score[i] = 1;
  }
  const radius = wallPhoto ? 4 : Math.max(2, Math.round(Math.max(width, height) / 340));
  const thick = spread(score, width, height, radius, true);
  const opened = spread(thick, width, height, wallPhoto ? 1 : Math.max(1, radius - 2), false);
  dropEdgeComponents(opened, width, height, wallPhoto ? 0 : 0.02);
  for (let x = 0; x < width; x++) {
    opened[x] = 0;
    opened[(height - 1) * width + x] = 0;
  }
  for (let y = 0; y < height; y++) {
    opened[y * width] = 0;
    opened[y * width + width - 1] = 0;
  }
  fillHoles(opened, width, height);
  // A closed ring can enclose the blue cushion. That blue is still background.
  for (let i = 0; i < count; i++) {
    const red = pixels[i * 4] / 255;
    const green = pixels[i * 4 + 1] / 255;
    const blue = pixels[i * 4 + 2] / 255;
    if (blue > red + 0.04 && Math.min(red, green) - blue < 0.05) opened[i] = 0;
  }
  dropSmallComponents(opened, width, height);
  keepPrincipalPieces(opened, width, height);
  let kept = 0;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (opened[y * width + x] > 0.45) {
        kept++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const box = (maxX - minX + 1) * (maxY - minY + 1);
  // A handful of specks spread across the frame is not a piece. A real necklace
  // still leaves velvet between its chains, so the box stays mostly clear.
  if (kept < count * 0.008 || kept > count * 0.5 || kept < box * 0.04 || maxX <= minX || maxY <= minY) return null;
  const pad = Math.round(Math.max(width, height) * 0.04);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  const outContext = out.getContext("2d");
  if (!outContext) return null;
  const cropped = outContext.createImageData(cropW, cropH);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const from = ((y + minY) * width + (x + minX)) * 4;
      const to = (y * cropW + x) * 4;
      const alpha = opened[(y + minY) * width + (x + minX)];
      cropped.data[to] = pixels[from];
      cropped.data[to + 1] = pixels[from + 1];
      cropped.data[to + 2] = pixels[from + 2];
      cropped.data[to + 3] = Math.round(Math.min(1, alpha) * 255);
    }
  }
  outContext.putImageData(cropped, 0, 0);
  return out;
}

/**
 * The salon photograph, bowed into a shallow relief. Bright gold lifts off the
 * velvet so a turn shows the real piece, not a stand-in model.
 */
function reliefFrom(image: CanvasImageSource, width: number, height: number, flat = false) {
  if (flat) return new THREE.PlaneGeometry(width, height, 1, 1);
  const cols = 88;
  const rows = 64;
  const geometry = new THREE.PlaneGeometry(width, height, cols, rows);
  const canvas = document.createElement("canvas");
  canvas.width = cols + 1;
  canvas.height = rows + 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return geometry;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const samples = (cols + 1) * (rows + 1);
  const lift = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const red = pixels[i * 4] / 255;
    const blue = pixels[i * 4 + 2] / 255;
    lift[i] = Math.min(1, Math.max(0, (red - blue) * 1.35));
  }
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const depth = height * 0.1;
  const bow = height * 0.045;
  for (let i = 0; i < position.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const x = Math.min(cols, Math.round(u * cols));
    const y = Math.min(rows, Math.round((1 - v) * rows));
    let sum = 0;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const sx = Math.min(cols, Math.max(0, x + ox));
        const sy = Math.min(rows, Math.max(0, y + oy));
        sum += lift[sy * (cols + 1) + sx];
      }
    }
    const across = u * 2 - 1;
    position.setZ(i, (sum / 9) * depth + (1 - across * across) * bow);
  }
  geometry.computeVertexNormals();
  return geometry;
}

type Ready = { geometry: THREE.BufferGeometry; texture: THREE.Texture; width: number; height: number; cutout?: boolean };

export function ReliefPhoto({ src, height, fit, cutout = false }: { src: string; height?: number; fit?: number; cutout?: boolean }) {
  const [view, setView] = useState<Ready | null>(null);
  const held = useRef<Ready | null>(null);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e0c17a", metalness: 1, roughness: 0.32 }), []);
  useEffect(() => () => frame.dispose(), [frame]);
  useEffect(() => () => {
    held.current?.geometry.dispose();
    held.current?.texture.dispose();
    held.current = null;
  }, []);
  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load(src, (map) => {
      if (!alive) {
        map.dispose();
        return;
      }
      const image = map.image as HTMLImageElement;
      const isolated = cutout ? isolateGold(image) : null;
      // A cut-out that cannot be separated is left out. The salon behind it
      // already shows the piece, and a framed copy of the velvet would not.
      if (cutout && !isolated) {
        map.dispose();
        return;
      }
      const plate: CanvasImageSource = isolated ?? image;
      const plateWidth = isolated ? isolated.width : image.width;
      const plateHeight = isolated ? isolated.height : image.height;
      const aspect = plateWidth / Math.max(1, plateHeight);
      const photoHeight = height ?? (fit ?? 1.6) / Math.max(1, aspect);
      const photoWidth = photoHeight * aspect;
      const texture = isolated ? new THREE.CanvasTexture(isolated) : map;
      if (isolated) map.dispose();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      const geometry = reliefFrom(plate, photoWidth, photoHeight, Boolean(isolated));
      held.current?.geometry.dispose();
      held.current?.texture.dispose();
      const next = { geometry, texture, width: photoWidth, height: photoHeight, cutout: Boolean(isolated) };
      held.current = next;
      setView(next);
    });
    return () => {
      alive = false;
    };
  }, [src, height, fit, cutout]);

  if (!view) return null;
  const thick = Math.max(0.028, view.height * 0.04);
  const floating = view.cutout === true;
  return (
    <group>
      <mesh geometry={view.geometry} position={[0, 0, floating ? 0 : thick / 2 + 0.004]}>
        <meshBasicMaterial map={view.texture} transparent={floating} alphaTest={floating ? 0.06 : 0} toneMapped={false} />
      </mesh>
      {floating ? null : (
        <mesh position={[0, 0, 0]} material={frame}>
          <boxGeometry args={[view.width + view.height * 0.018, view.height + view.height * 0.018, thick]} />
        </mesh>
      )}
    </group>
  );
}
