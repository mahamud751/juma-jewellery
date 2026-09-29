import * as THREE from "three";

/**
 * Round brilliant cut, girdle radius 1. Table up, culet down.
 * Built as a flat-shaded, non-indexed mesh so every facet catches light on its own.
 */
export function createBrilliant({
  table = 0.56,
  crown = 0.3,
  pavilion = 0.86,
  girdle = 0.035,
}: { table?: number; crown?: number; pavilion?: number; girdle?: number } = {}) {
  const ring = (count: number, radius: number, y: number, offset = 0) =>
    Array.from({ length: count }, (_, i) => {
      const a = ((i + offset) / count) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
    });

  const T = ring(8, table, crown);
  const S = ring(8, (table + 1) / 2 + 0.06, crown * 0.52, 0.5);
  const G = ring(16, 1, 0);
  const B = ring(16, 1, -girdle);
  const P = ring(8, 0.44, -girdle - pavilion * 0.58);
  const top = new THREE.Vector3(0, crown, 0);
  const culet = new THREE.Vector3(0, -girdle - pavilion, 0);

  const tris: THREE.Vector3[][] = [];
  const at = <V>(list: V[], i: number) => list[((i % list.length) + list.length) % list.length];

  for (let k = 0; k < 8; k++) {
    tris.push([top, at(T, k), at(T, k + 1)]);
    tris.push([at(T, k), at(S, k), at(T, k + 1)]);
    tris.push([at(T, k), at(S, k - 1), at(G, 2 * k)]);
    tris.push([at(T, k), at(G, 2 * k), at(S, k)]);
    tris.push([at(S, k), at(G, 2 * k), at(G, 2 * k + 1)]);
    tris.push([at(S, k), at(G, 2 * k + 1), at(G, 2 * k + 2)]);

    tris.push([at(P, k), at(B, 2 * k - 1), at(B, 2 * k)]);
    tris.push([at(P, k), at(B, 2 * k), at(B, 2 * k + 1)]);
    tris.push([at(P, k), at(B, 2 * k + 1), at(P, k + 1)]);
    tris.push([culet, at(P, k), at(P, k + 1)]);
  }
  for (let i = 0; i < 16; i++) {
    tris.push([at(G, i), at(B, i), at(B, i + 1)]);
    tris.push([at(G, i), at(B, i + 1), at(G, i + 1)]);
  }

  const center = new THREE.Vector3(0, (crown - girdle - pavilion) / 2, 0);
  const positions: number[] = [];
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const mid = new THREE.Vector3();
  for (const [a, b, c] of tris) {
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    const normal = ab.cross(ac);
    mid.copy(a).add(b).add(c).divideScalar(3).sub(center);
    const [p, q, r] = normal.dot(mid) < 0 ? [a, c, b] : [a, b, c];
    positions.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.translate(0, -center.y, 0);
  return geometry;
}

let shared: THREE.BufferGeometry | null = null;

/** One geometry instance for every stone in the scene. */
export function brilliantGeometry() {
  shared ??= createBrilliant();
  return shared;
}
