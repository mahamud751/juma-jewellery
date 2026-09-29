import * as THREE from "three";

/**
 * A faceless display figure, modelled in metres with y = 0 at the waist cut.
 * Every garment and jewel is placed on the same analytic surfaces, so chains and cloth sit on the body.
 */

type Knots = readonly (readonly [number, number])[];

/** Catmull-Rom through [y, value] knots, clamped at both ends. */
function smooth(knots: Knots) {
  const last = knots.length - 1;
  return (y: number) => {
    if (y <= knots[0][0]) return knots[0][1];
    if (y >= knots[last][0]) return knots[last][1];
    let i = 0;
    while (y > knots[i + 1][0]) i++;
    const p0 = knots[Math.max(0, i - 1)][1];
    const p1 = knots[i][1];
    const p2 = knots[i + 1][1];
    const p3 = knots[Math.min(last, i + 2)][1];
    const t = (y - knots[i][0]) / (knots[i + 1][0] - knots[i][0]);
    const t2 = t * t;
    return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t2 * t);
  };
}

const gauss = (x: number, sigma: number) => Math.exp(-(x * x) / (2 * sigma * sigma));

/** Half-width of the torso and neck at height y. */
const WIDTH = smooth([
  [0, 0.135],
  [0.08, 0.13],
  [0.16, 0.138],
  [0.25, 0.152],
  [0.33, 0.168],
  [0.39, 0.186],
  [0.425, 0.182],
  [0.448, 0.158],
  [0.463, 0.118],
  [0.474, 0.078],
  [0.49, 0.058],
  [0.53, 0.052],
  [0.62, 0.05],
]);

/** Front-to-back depth as a share of the width: round at the neck, flat across the shoulders. */
const DEPTH = smooth([
  [0, 0.78],
  [0.2, 0.7],
  [0.33, 0.6],
  [0.4, 0.5],
  [0.45, 0.52],
  [0.468, 0.66],
  [0.485, 0.92],
  [0.62, 0.96],
]);

export const NECK_TOP = 0.6;

/** Point on the torso at angle phi (0 faces +z, +phi turns toward +x) and height y, lifted off the skin. */
export function torsoPoint(phi: number, y: number, lift = 0, out = new THREE.Vector3()) {
  const r = WIDTH(y);
  const chest = 0.03 * gauss(y - 0.255, 0.045) * (gauss(phi - 0.48, 0.26) + gauss(phi + 0.48, 0.26));
  return out.set(Math.sin(phi) * (r + lift), y, Math.cos(phi) * (r * DEPTH(y) + lift) + chest);
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

/** Outward surface normal of the torso, by finite differences. */
export function torsoNormal(phi: number, y: number, out = new THREE.Vector3()) {
  const e = 1e-3;
  torsoPoint(phi + e, y, 0, _a).sub(torsoPoint(phi - e, y, 0, out));
  torsoPoint(phi, y + e, 0, _b).sub(torsoPoint(phi, y - e, 0, out));
  return out.crossVectors(_a, _b).normalize();
}

export const HEAD = { y: 0.655, z: 0.012, rx: 0.074, ry: 0.112, rz: 0.094 };

/** Point on the head; theta runs from the crown (0) to under the chin (π). */
export function headPoint(phi: number, theta: number, lift = 0, out = new THREE.Vector3()) {
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  const jaw = 1 - 0.28 * Math.pow(Math.max(0, -c), 1.6);
  const face = Math.cos(phi) > 0 ? 0.93 : 1;
  return out.set(
    Math.sin(phi) * s * (HEAD.rx * jaw + lift),
    HEAD.y + c * (HEAD.ry + lift),
    HEAD.z + Math.cos(phi) * s * (HEAD.rz * jaw * face + lift),
  );
}

/** How far down from the crown the hair reaches: a centre-parted hairline, over the ears, low at the nape. */
export const hairline = (phi: number) => 1.12 + 1.15 * Math.pow((1 - Math.cos(phi)) / 2, 0.85);

/** Hair volume above the scalp: flat at the hairline, fullest over the crown and toward the bun. */
export function hairLift(phi: number, theta: number) {
  const v = THREE.MathUtils.clamp(1 - theta / hairline(phi), 0, 1);
  const back = (1 - Math.cos(phi)) / 2;
  return 0.004 + 0.011 * THREE.MathUtils.smoothstep(v, 0, 0.5) * (0.55 + 0.45 * back);
}

/** Neckline of the blouse: a deep scoop in front, over the shoulders, a softer scoop behind. */
export function neckline(phi: number) {
  const w = Math.abs(phi);
  if (w <= 1.3) return 0.29 + 0.155 * Math.pow(w / 1.3, 1.4);
  return 0.445 - 0.075 * Math.pow((w - 1.3) / (Math.PI - 1.3), 1.2);
}

/** Closed surface: columns wrap once around phi, rows run v from 0 (bottom edge) to 1 (top edge). */
export function wrapSurface(point: (phi: number, v: number, out: THREE.Vector3) => THREE.Vector3, columns: number, rows: number) {
  const positions = new Float32Array(columns * (rows + 1) * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j < columns; j++) {
      point(-Math.PI + (j / columns) * Math.PI * 2, i / rows, p).toArray(positions, (i * columns + j) * 3);
    }
  }
  const index: number[] = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const a = i * columns + j;
      const b = i * columns + ((j + 1) % columns);
      index.push(a, b, b + columns, a, b + columns, a + columns);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/** A smooth path over the torso through [phi, y] control pairs. */
export function torsoPath(controls: readonly (readonly [number, number])[], lift: number) {
  const params = new THREE.CatmullRomCurve3(controls.map(([phi, y]) => new THREE.Vector3(phi, y, 0)), false, "centripetal");
  return {
    params,
    curve: new THREE.CatmullRomCurve3(params.getSpacedPoints(160).map((p) => torsoPoint(p.x, p.y, lift)), false, "centripetal"),
  };
}

/**
 * A strip of cloth lying on the torso along a [phi, y] path. `bands` gives
 * [across, colour] stops; repeating an `across` value makes a hard colour edge.
 */
export function clothStrip(
  controls: readonly (readonly [number, number])[],
  width: number,
  lift: number,
  bands: readonly (readonly [number, string])[],
  segments = 140,
) {
  const { params } = torsoPath(controls, lift);
  const colors = bands.map(([, c]) => new THREE.Color(c));
  const across = bands.length;
  const positions: number[] = [];
  const colorData: number[] = [];
  const p = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const behind = new THREE.Vector3();
  const n = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let k = 0; k <= segments; k++) {
    const t = k / segments;
    const q = params.getPointAt(t);
    const q0 = params.getPointAt(Math.max(0, t - 0.004));
    const q1 = params.getPointAt(Math.min(1, t + 0.004));
    torsoPoint(q.x, q.y, lift, p);
    torsoPoint(q1.x, q1.y, lift, ahead).sub(torsoPoint(q0.x, q0.y, lift, behind));
    torsoNormal(q.x, q.y, n);
    side.crossVectors(ahead, n).normalize();
    for (let i = 0; i < across; i++) {
      const u = bands[i][0];
      // A soft pleat ripple across the width, strongest mid-strip.
      const ripple = 0.0035 * Math.sin(u * Math.PI) * Math.pow(Math.sin(u * Math.PI * 3 + t * 9), 2);
      positions.push(
        p.x + side.x * (u - 0.5) * width + n.x * ripple,
        p.y + side.y * (u - 0.5) * width + n.y * ripple,
        p.z + side.z * (u - 0.5) * width + n.z * ripple,
      );
      colorData.push(colors[i].r, colors[i].g, colors[i].b);
    }
  }

  const index: number[] = [];
  for (let k = 0; k < segments; k++) {
    for (let i = 0; i < across - 1; i++) {
      const a = k * across + i;
      const b = a + across;
      index.push(a, b, b + 1, a, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colorData, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}
