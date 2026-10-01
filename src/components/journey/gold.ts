import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * Five creations modelled from the pieces on the salon walls (photos 37 and 38). Everything is closed,
 * solid geometry, so the back of each piece is designed, not guessed, and holds up through a full turn.
 * Each piece is merged into one geometry per material: gold, stone, velvet.
 */
export type PieceGeometry = { gold: THREE.BufferGeometry; stone?: THREE.BufferGeometry; velvet?: THREE.BufferGeometry; height: number };

type Bucket = { gold: THREE.BufferGeometry[]; stone: THREE.BufferGeometry[]; velvet: THREE.BufferGeometry[] };
const bucket = (): Bucket => ({ gold: [], stone: [], velvet: [] });

const Z = new THREE.Vector3(0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);
const matrix = new THREE.Matrix4();

function put(list: THREE.BufferGeometry[], geometry: THREE.BufferGeometry, transform?: THREE.Matrix4) {
  if (transform) geometry.applyMatrix4(transform);
  list.push(geometry.index ? geometry.toNonIndexed() : geometry);
  if (geometry.index) geometry.dispose();
}

function merge(list: THREE.BufferGeometry[]) {
  if (!list.length) return undefined;
  list.forEach((geometry) => { geometry.deleteAttribute("uv"); });
  const merged = mergeGeometries(list, false);
  list.forEach((geometry) => geometry.dispose());
  merged.computeBoundingSphere();
  return merged;
}

/** A frame whose z axis faces `normal`, keeping y as close to world up as possible. */
function facing(position: THREE.Vector3, normal: THREE.Vector3, scale = 1, spin = 0) {
  const m = new THREE.Matrix4().lookAt(normal, new THREE.Vector3(), Math.abs(normal.dot(UP)) > .98 ? Z : UP);
  if (spin) m.multiply(new THREE.Matrix4().makeRotationZ(spin));
  return m.scale(new THREE.Vector3(scale, scale, scale)).setPosition(position);
}

const sphere = (radius: number, detail = 10) => new THREE.SphereGeometry(radius, detail, Math.max(6, Math.round(detail * .7)));
const tube = (points: THREE.Vector3[], radius: number, closed = false, segments = 3, radial = 6) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed, "centripetal"), Math.max(8, points.length * segments), radius, radial, closed);

function bead(list: THREE.BufferGeometry[], at: THREE.Vector3, radius: number, detail = 10) {
  put(list, sphere(radius, detail), new THREE.Matrix4().makeTranslation(at.x, at.y, at.z));
}

/** A teardrop, point up, hanging below `at`. */
function drop(list: THREE.BufferGeometry[], at: THREE.Vector3, length: number) {
  const profile = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    return new THREE.Vector2(Math.max(.0005, Math.sin(Math.PI * t) ** 1.3 * length * .32 * (1 - t * .35)), -t * length);
  });
  put(list, new THREE.LatheGeometry(profile, 12), new THREE.Matrix4().makeTranslation(at.x, at.y, at.z));
}

/** Short strand of beads ending in a drop: the fringe on jhumkas and pendants. */
function tassel(list: THREE.BufferGeometry[], at: THREE.Vector3, length: number, size: number) {
  const count = Math.max(2, Math.round(length / (size * 2.6)));
  for (let i = 0; i < count; i++) bead(list, new THREE.Vector3(at.x, at.y - i * size * 2.4, at.z), size * (i === 0 ? .8 : 1), 8);
  drop(list, new THREE.Vector3(at.x, at.y - count * size * 2.4 + size * .6, at.z), size * 3.2);
}

/** Interlocking oval links along a curve, alternating by a quarter turn. */
function chain(list: THREE.BufferGeometry[], curve: THREE.Curve<THREE.Vector3>, link: number, wire: number) {
  const length = curve.getLength();
  const count = Math.floor(length / (link * 1.25));
  const base = new THREE.TorusGeometry(link, wire, 5, 10);
  base.scale(1.45, 1, 1);
  const tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3(), point = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const t = (i + .5) / count;
    curve.getPointAt(t, point);
    curve.getTangentAt(t, tangent).normalize();
    normal.crossVectors(tangent, Math.abs(tangent.y) > .9 ? Z : UP).normalize();
    binormal.crossVectors(tangent, normal).normalize();
    if (i % 2) matrix.makeBasis(tangent, binormal, normal.clone().negate());
    else matrix.makeBasis(tangent, normal, binormal);
    matrix.setPosition(point);
    put(list, base.clone(), matrix);
  }
  base.dispose();
}

/** Bow a flat plate into a low dome, so polished gold catches light across it instead of mirroring one dark spot. */
function dome(geometry: THREE.BufferGeometry, size: number, height: number) {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const r = Math.hypot(position.getX(i), position.getY(i)) / size;
    position.setZ(i, position.getZ(i) + size * height * Math.max(0, 1 - r * r));
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Raised filigree flower, facing +z: a bevelled petal plate, two wire outlines, granulation and a centre. */
function flower(parts: Bucket, size: number, petals: number, transform: THREE.Matrix4, ruby = false) {
  const local = bucket();
  const radius = (angle: number, scale = 1) => size * scale * (.6 + .4 * Math.abs(Math.cos(petals * angle / 2)) ** .75);
  const shape = new THREE.Shape();
  for (let i = 0; i <= 120; i++) {
    const a = i / 120 * Math.PI * 2, r = radius(a, .94);
    if (i === 0) shape.moveTo(Math.sin(a) * r, Math.cos(a) * r);
    else shape.lineTo(Math.sin(a) * r, Math.cos(a) * r);
  }
  const plate = new THREE.ExtrudeGeometry(shape, { depth: size * .05, bevelEnabled: true, bevelThickness: size * .04, bevelSize: size * .04, bevelSegments: 2, curveSegments: 120 });
  plate.translate(0, 0, -size * .09);
  put(local.gold, dome(plate, size, .22));
  const outline = (scale: number, turn: number, z: number) => Array.from({ length: 96 }, (_, i) => {
    const a = i / 96 * Math.PI * 2 + turn, r = radius(a - turn, scale);
    return new THREE.Vector3(Math.sin(a) * r, Math.cos(a) * r, z);
  });
  put(local.gold, tube(outline(1, 0, size * .02), size * .045, true, 2, 6));
  put(local.gold, tube(outline(.62, Math.PI / petals, size * .06), size * .04, true, 2, 6));
  for (let i = 0; i < petals; i++) {
    const a = i / petals * Math.PI * 2;
    bead(local.gold, new THREE.Vector3(Math.sin(a) * size * 1.04, Math.cos(a) * size * 1.04, size * .02), size * .075, 8);
    bead(local.gold, new THREE.Vector3(Math.sin(a + Math.PI / petals) * size * .5, Math.cos(a + Math.PI / petals) * size * .5, size * .09), size * .055, 8);
  }
  for (let i = 0; i < petals * 2; i++) {
    const a = i / (petals * 2) * Math.PI * 2;
    bead(local.gold, new THREE.Vector3(Math.sin(a) * size * .36, Math.cos(a) * size * .36, size * .1), size * .04, 6);
  }
  const centre = sphere(size * .27, 20);
  centre.scale(1, 1, .6);
  centre.translate(0, 0, size * .1);
  put(ruby ? local.stone : local.gold, centre);
  if (ruby) put(local.gold, new THREE.TorusGeometry(size * .28, size * .035, 6, 32), new THREE.Matrix4().makeTranslation(0, 0, size * .1));
  for (const key of ["gold", "stone"] as const) local[key].forEach((geometry) => put(parts[key], geometry, transform));
}

/** Paisley (mango) pendant, point up, facing +z. */
function mango(parts: Bucket, size: number, transform: THREE.Matrix4) {
  const local = bucket();
  const outline: THREE.Vector2[] = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90 * Math.PI * 2;
    // A teardrop, round at the bottom, whose tip curls to one side.
    const y = Math.cos(t) * size;
    const curl = Math.max(0, (y / size - .3) / .7) ** 2;
    outline.push(new THREE.Vector2(Math.sin(t) * Math.abs(Math.sin(t / 2)) ** 1.15 * size * .7 - curl * size * .25, y));
  }
  const shape = new THREE.Shape(outline);
  const plate = new THREE.ExtrudeGeometry(shape, { depth: size * .06, bevelEnabled: true, bevelThickness: size * .05, bevelSize: size * .045, bevelSegments: 3, curveSegments: 90 });
  plate.translate(0, 0, -size * .1);
  put(local.gold, dome(plate, size, .16));
  const rim = (scale: number, z: number) => outline.filter((_, i) => i % 2 === 0).map((p) => new THREE.Vector3(p.x * scale, (p.y + size * .35) * scale - size * .35, z));
  put(local.gold, tube(rim(1, size * .03), size * .04, true, 2, 6));
  put(local.gold, tube(rim(.7, size * .07), size * .03, true, 2, 6));
  for (let i = 0; i < outline.length - 1; i += 4) bead(local.gold, new THREE.Vector3(outline[i].x * 1.1, outline[i].y * 1.05 + size * .02, 0), size * .05, 8);
  const stone = sphere(size * .26, 20);
  stone.scale(.8, 1.1, .55);
  stone.translate(0, -size * .38, size * .08);
  put(local.stone, stone);
  put(local.gold, new THREE.TorusGeometry(size * .25, size * .03, 6, 32), new THREE.Matrix4().makeScale(.82, 1.12, 1).setPosition(0, -size * .38, size * .08));
  flower(local, size * .2, 6, new THREE.Matrix4().makeTranslation(-size * .02, size * .3, size * .05));
  // Bail at the curled tip, and the fringe.
  put(local.gold, new THREE.TorusGeometry(size * .1, size * .03, 6, 20), new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(-size * .25, size * 1.08, 0));
  for (let i = -3; i <= 3; i++) tassel(local.gold, new THREE.Vector3(i * size * .12, -size * 1.0 + Math.abs(i) * size * .05, 0), size * (.42 - Math.abs(i) * .05), size * .055);
  for (const key of ["gold", "stone"] as const) local[key].forEach((geometry) => put(parts[key], geometry, transform));
}

/* A royal blue velvet display bust, as on the salon walls. The cross-section is an ellipse. */
const BUST_DEPTH = .56;
/** Busts are framed on the neck and chest, where the gold is; the base falls below the frame. */
const BUST_CROP = .02;
const BUST_PROFILE = new THREE.SplineCurve([
  [.001, 0], [.46, 0], [.48, .05], [.42, .1], [.44, .2], [.54, .5], [.64, .82], [.72, 1.04], [.74, 1.13], [.67, 1.24], [.5, 1.33], [.3, 1.4], [.21, 1.47], [.19, 1.6], [.19, 1.82], [.15, 1.9], [.06, 1.93], [.001, 1.94],
].map(([x, y]) => new THREE.Vector2(x, y))).getPoints(90);

function bustRadius(y: number) {
  for (let i = 1; i < BUST_PROFILE.length; i++) {
    const a = BUST_PROFILE[i - 1], b = BUST_PROFILE[i];
    if (a.y >= .2 && y >= a.y && y <= b.y) return a.x + (b.x - a.x) * ((y - a.y) / Math.max(1e-6, b.y - a.y));
  }
  return .2;
}

function bust(parts: Bucket) {
  const body = new THREE.LatheGeometry(BUST_PROFILE, 72);
  body.scale(1, 1, BUST_DEPTH);
  body.computeVertexNormals();
  put(parts.velvet, body);
  put(parts.gold, new THREE.TorusGeometry(.47, .018, 8, 72), new THREE.Matrix4().makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeScale(1, 1, BUST_DEPTH)).setPosition(0, .012, 0));
}

/** A loop around the bust: high at the back of the neck, dropping `drop` at the front. */
function neckline(drop: number, back = 1.52, sharp = 1.6, lift = .02) {
  const at = (a: number) => {
    const front = ((1 + Math.cos(a)) / 2) ** sharp;
    const y = back - drop * front;
    const r = bustRadius(y) + lift;
    return { point: new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r * BUST_DEPTH + lift * Math.cos(a) * .5), normal: new THREE.Vector3(Math.sin(a) * BUST_DEPTH, .18 * front, Math.cos(a)).normalize() };
  };
  const points = Array.from({ length: 96 }, (_, i) => at(-Math.PI + i / 96 * Math.PI * 2).point);
  return { curve: new THREE.CatmullRomCurve3(points, true, "centripetal"), at };
}

function finish(parts: Bucket, offsetY = 0): PieceGeometry {
  const gold = merge(parts.gold)!;
  const stone = merge(parts.stone);
  const velvet = merge(parts.velvet);
  const box = new THREE.Box3().setFromBufferAttribute(gold.getAttribute("position") as THREE.BufferAttribute);
  if (velvet) box.union(new THREE.Box3().setFromBufferAttribute(velvet.getAttribute("position") as THREE.BufferAttribute));
  const centre = box.getCenter(new THREE.Vector3());
  const shift = (geometry?: THREE.BufferGeometry) => geometry?.translate(-centre.x, -centre.y + offsetY, -centre.z);
  shift(gold); shift(stone); shift(velvet);
  return { gold, stone, velvet, height: box.max.y - box.min.y };
}

/** 01 — Mango pendant on a fine cable chain. */
function pendantChain() {
  const parts = bucket();
  bust(parts);
  const line = neckline(.78, 1.52, 1.25, .015);
  chain(parts.gold, line.curve, .018, .0055);
  const { point, normal } = line.at(0);
  mango(parts, .2, facing(point.clone().add(new THREE.Vector3(0, -.22, .035)), normal.clone().add(new THREE.Vector3(0, .12, 0)).normalize()));
  // A second, finer strand with small gold balls.
  const fine = neckline(.5, 1.5, 1.4, .012);
  chain(parts.gold, fine.curve, .012, .004);
  for (let a = -1.2; a <= 1.21; a += .2) bead(parts.gold, fine.at(a).point, .022, 10);
  return finish(parts, BUST_CROP);
}

/** 02 — Rani haar: flower collar, bead strand, ruby drop pendant. */
function raniHaar() {
  const parts = bucket();
  bust(parts);
  const collar = neckline(.36, 1.5, 1.5, .03);
  chain(parts.gold, collar.curve, .02, .006);
  for (let i = -6; i <= 6; i++) {
    const { point, normal } = collar.at(i * .2);
    flower(parts, i === 0 ? .1 : .07 - Math.abs(i) * .002, 8, facing(point.clone().add(normal.clone().multiplyScalar(.02)), normal), i % 3 === 0);
    tassel(parts.gold, point.clone().add(new THREE.Vector3(0, -.09, .02)).add(normal.clone().multiplyScalar(.02)), .08, .016);
  }
  const strand = neckline(.68, 1.49, 1.3, .03);
  for (let i = 0; i <= 64; i++) {
    const a = -1.9 + i / 64 * 3.8;
    bead(parts.gold, strand.at(a).point, i % 4 === 0 ? .032 : .022, 10);
  }
  chain(parts.gold, neckline(.68, 1.49, 1.3, .028).curve, .012, .004);
  const { point, normal } = strand.at(0);
  const pendant = facing(point.clone().add(new THREE.Vector3(0, -.2, .05)), normal.clone().add(new THREE.Vector3(0, .1, 0)).normalize());
  flower(parts, .17, 10, pendant, true);
  drop(parts.stone, new THREE.Vector3(0, -.19, .02).applyMatrix4(pendant), .17);
  for (let i = -4; i <= 4; i++) if (i) tassel(parts.gold, new THREE.Vector3(i * .045, -.16 + Math.abs(i) * .012, 0).applyMatrix4(pendant), .14 - Math.abs(i) * .015, .018);
  return finish(parts, BUST_CROP);
}

/** 03 — A pair of bell jhumkas with a flower stud and bead fringe. */
function jhumkas() {
  const parts = bucket();
  const outer: [number, number][] = [[.001, .02], [.07, .015], [.15, -.03], [.23, -.12], [.29, -.24], [.32, -.33], [.335, -.38], [.31, -.395], [.3, -.36], [.27, -.25], [.21, -.14], [.13, -.07], [.05, -.04], [.001, -.035]];
  const bell = () => {
    const local = bucket();
    put(local.gold, new THREE.LatheGeometry(outer.map(([x, y]) => new THREE.Vector2(x, y)), 64));
    for (const [r, y] of [[.215, -.12], [.29, -.25]]) put(local.gold, new THREE.TorusGeometry(r, .016, 6, 64), new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, y, 0));
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * Math.PI * 2;
      bead(local.gold, new THREE.Vector3(Math.sin(a) * .26, -.185, Math.cos(a) * .26), .018, 8);
      const rim = new THREE.Vector3(Math.sin(a) * .335, -.39, Math.cos(a) * .335);
      bead(local.gold, rim, .022, 8);
      tassel(local.gold, rim.clone().add(new THREE.Vector3(0, -.04, 0)), .1 + (i % 2) * .04, .016);
    }
    bead(local.gold, new THREE.Vector3(0, .05, 0), .045, 12);
    put(local.gold, new THREE.TorusGeometry(.05, .014, 6, 20), new THREE.Matrix4().makeTranslation(0, .12, 0));
    flower(local, .16, 8, new THREE.Matrix4().makeTranslation(0, .32, 0), true);
    // Hook behind the stud, visible from the back.
    put(local.gold, tube([new THREE.Vector3(0, .32, -.03), new THREE.Vector3(0, .4, -.12), new THREE.Vector3(0, .3, -.2), new THREE.Vector3(0, .18, -.17)], .012, false, 6, 6));
    bead(local.gold, new THREE.Vector3(0, -.3, 0), .05, 12);
    return local;
  };
  for (const side of [-1, 1]) {
    const local = bell();
    const transform = new THREE.Matrix4().makeRotationY(side * .35).setPosition(side * .42, side * .06, 0);
    for (const key of ["gold", "stone"] as const) local[key].forEach((geometry) => put(parts[key], geometry, transform));
  }
  return finish(parts);
}

/** 04 — Three bangles: beaded band, twisted rope kada, beaded band. */
function churi() {
  const parts = bucket();
  const band = (radius: number, tubeRadius: number, width: number, pattern: (around: number, across: number) => number) => {
    const geometry = new THREE.TorusGeometry(radius, tubeRadius, 18, 260);
    const position = geometry.attributes.position;
    const v = new THREE.Vector3(), centre = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i);
      const around = Math.atan2(v.y, v.x);
      centre.set(Math.cos(around) * radius, Math.sin(around) * radius, 0);
      const offset = v.clone().sub(centre);
      const across = Math.atan2(offset.z, offset.dot(centre.clone().normalize()));
      offset.multiplyScalar(1 + pattern(around, across));
      offset.z *= width;
      position.setXYZ(i, centre.x + offset.x, centre.y + offset.y, offset.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  };
  const beaded = (z: number) => {
    put(parts.gold, band(.6, .05, 1.9, (around) => .12 * Math.max(0, Math.sin(around * 40)) ** 2), new THREE.Matrix4().makeTranslation(0, 0, z));
    for (const edge of [-1, 1]) for (let i = 0; i < 90; i++) {
      const a = i / 90 * Math.PI * 2;
      bead(parts.gold, new THREE.Vector3(Math.cos(a) * .64, Math.sin(a) * .64, z + edge * .088), .019, 8);
    }
  };
  beaded(-.24);
  beaded(.24);
  put(parts.gold, band(.61, .085, 1.35, (around, across) => .16 * Math.sin(around * 36 + across * 2)), new THREE.Matrix4());
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    flower(parts, .055, 6, facing(new THREE.Vector3(Math.cos(a) * .7, Math.sin(a) * .7, 0), new THREE.Vector3(Math.cos(a), Math.sin(a), 0)), true);
  }
  const result = finish(parts);
  // Stand the stack on edge, tilted toward the viewer.
  const tilt = new THREE.Matrix4().makeRotationX(-1.05).premultiply(new THREE.Matrix4().makeRotationZ(.18));
  for (const geometry of [result.gold, result.stone]) geometry?.applyMatrix4(tilt);
  return result;
}

/** 05 — Flower ring: eight-petal filigree head with a ruby, beaded shoulders. */
function flowerRing() {
  const parts = bucket();
  const shank = new THREE.TorusGeometry(.32, .042, 14, 120);
  shank.scale(1, 1, 1.7);
  put(parts.gold, shank, new THREE.Matrix4().makeRotationY(Math.PI / 2));
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + side * (.42 + i * .17);
    bead(parts.gold, new THREE.Vector3(0, Math.sin(a) * .37, Math.cos(a) * .37), .032 - i * .005, 10);
  }
  flower(parts, .2, 8, facing(new THREE.Vector3(0, .4, 0), new THREE.Vector3(0, 1, .55).normalize()), true);
  put(parts.gold, new THREE.CylinderGeometry(.12, .08, .08, 24), new THREE.Matrix4().makeTranslation(0, .35, 0));
  const result = finish(parts);
  const tilt = new THREE.Matrix4().makeRotationX(.25);
  for (const geometry of [result.gold, result.stone]) geometry?.applyMatrix4(tilt);
  return result;
}

export const BUILDERS = [pendantChain, raniHaar, jhumkas, churi, flowerRing];

/** Points on the gold that catch the light: positions and normals for the glints. */
export function glintPoints(geometry: THREE.BufferGeometry, count: number, seed = 7) {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3), phases = new Float32Array(count);
  let state = seed;
  const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < count; i++) {
    const index = Math.floor(random() * position.count);
    positions.set([position.getX(index), position.getY(index), position.getZ(index)], i * 3);
    normals.set([normal.getX(index), normal.getY(index), normal.getZ(index)], i * 3);
    phases[i] = random() * Math.PI * 2;
  }
  return { positions, normals, phases };
}
