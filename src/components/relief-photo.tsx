"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * The salon photograph, bowed into a shallow relief. Bright gold lifts off the
 * velvet so a turn shows the real piece, not a stand-in model.
 */
export function reliefFrom(image: CanvasImageSource, width: number, height: number) {
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

type Ready = { geometry: THREE.BufferGeometry; texture: THREE.Texture; width: number; height: number };

export function ReliefPhoto({ src, height, fit }: { src: string; height?: number; fit?: number }) {
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
      const aspect = image.width / Math.max(1, image.height);
      const photoHeight = height ?? (fit ?? 1.6) / Math.max(1, aspect);
      const photoWidth = photoHeight * aspect;
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;
      const geometry = reliefFrom(image, photoWidth, photoHeight);
      held.current?.geometry.dispose();
      held.current?.texture.dispose();
      const next = { geometry, texture: map, width: photoWidth, height: photoHeight };
      held.current = next;
      setView(next);
    });
    return () => {
      alive = false;
    };
  }, [src, height, fit]);

  if (!view) return null;
  const thick = Math.max(0.028, view.height * 0.04);
  return (
    <group>
      <mesh geometry={view.geometry} position={[0, 0, thick / 2 + 0.004]}>
        <meshBasicMaterial map={view.texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0]} material={frame}>
        <boxGeometry args={[view.width + view.height * 0.018, view.height + view.height * 0.018, thick]} />
      </mesh>
    </group>
  );
}
