"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { MALL, clamp01, depthUrl, photoUrl, smooth, type Shot, type ShotKey } from "@/lib/journey";

/** The photos were taken with roughly this vertical field of view; 4:3 frames. */
export const PHOTO_FOV = 50;
export const PHOTO_ASPECT = 4 / 3;
const TAN = Math.tan(THREE.MathUtils.degToRad(PHOTO_FOV / 2));
/** Grid beyond the frame (in uv) so small camera moves never show an empty edge. */
const SKIRT = .12;

export type DepthField = { width: number; height: number; data: Uint8ClampedArray };

/** Distance along the view axis for a normalised disparity (1 = nearest). */
const toDistance = (disparity: number, near: number, far: number) => 1 / (disparity * (1 / near - 1 / far) + 1 / far);

function sampleDepth(field: DepthField, u: number, v: number) {
  const x = clamp01(u) * (field.width - 1), y = clamp01(v) * (field.height - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(field.width - 1, x0 + 1), y1 = Math.min(field.height - 1, y0 + 1);
  const at = (px: number, py: number) => field.data[(py * field.width + px) * 4] / 255;
  const top = at(x0, y0) + (at(x1, y0) - at(x0, y0)) * (x - x0);
  const bottom = at(x0, y1) + (at(x1, y1) - at(x0, y1)) * (x - x0);
  return top + (bottom - top) * (y - y0);
}

/** The 3D point a pixel of the photo shows, in the photo camera's space (−z forward). */
function pixelPoint(field: DepthField, shot: Shot, [u, v]: [number, number], out: THREE.Vector3) {
  const z = toDistance(sampleDepth(field, u, v), shot.near, shot.far);
  return out.set((u - .5) * 2 * TAN * PHOTO_ASPECT * z, (.5 - v) * 2 * TAN * z, -z);
}

const scratch = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), m: new THREE.Matrix4() };

/** Camera pose inside a photo at this progress: eased between keys, so it settles on each stop. */
export function shotPose(field: DepthField, shot: Shot, progress: number, pose: THREE.Matrix4) {
  const keys = shot.keys;
  let index = 0;
  while (index < keys.length - 2 && progress > keys[index + 1].at) index++;
  const from: ShotKey = keys[index], to: ShotKey = keys[Math.min(keys.length - 1, index + 1)];
  const t = to === from ? 0 : smooth(from.at, to.at, progress);
  const position = pixelPoint(field, shot, from.go, scratch.a).multiplyScalar(from.f)
    .lerp(pixelPoint(field, shot, to.go, scratch.b).multiplyScalar(to.f), t);
  const target = pixelPoint(field, shot, from.look, scratch.c).lerp(pixelPoint(field, shot, to.look, scratch.d), t);
  pose.lookAt(position, target, scratch.up).setPosition(position);
  return THREE.MathUtils.lerp(from.dim ?? 0, to.dim ?? 0, t);
}

const vertexShader = /* glsl */ `
  uniform sampler2D depthMap;
  uniform float near, far, tanHalf, aspect;
  varying vec2 vUv;
  varying float vEdge;
  void main() {
    vec2 st = clamp(uv, 0.0, 1.0);
    vUv = st;
    float disparity = texture2D(depthMap, st).r;
    float z = 1.0 / (disparity * (1.0 / near - 1.0 / far) + 1.0 / far);
    vec3 p = vec3((uv.x - .5) * 2.0 * tanHalf * aspect * z, (uv.y - .5) * 2.0 * tanHalf * z, -z);
    // Stretched triangles sit across a depth jump; the fragment shader softens them.
    vec2 texel = vec2(1.0 / 256.0);
    float dx = abs(texture2D(depthMap, st + vec2(texel.x, 0.0)).r - texture2D(depthMap, st - vec2(texel.x, 0.0)).r);
    float dy = abs(texture2D(depthMap, st + vec2(0.0, texel.y)).r - texture2D(depthMap, st - vec2(0.0, texel.y)).r);
    vEdge = smoothstep(.06, .2, max(dx, dy));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float opacity, dim, hole, edgeBlend, entrance;
  uniform vec2 resolution;
  varying vec2 vUv;
  varying float vEdge;
  void main() {
    vec3 color = texture2D(map, vUv).rgb;
    // Smear across depth jumps reads as a soft shadow instead of a rubber sheet.
    color *= 1.0 - vEdge * edgeBlend * .45;
    vec2 screen = gl_FragCoord.xy / resolution - .5;
    screen.x *= resolution.x / resolution.y;
    float r = length(screen);
    // Behind a creation: darker, warmer, quieter, with a vignette.
    float luma = dot(color, vec3(.2126, .7152, .0722));
    color = mix(color, vec3(luma) * vec3(1.05, .92, .78), dim * .45);
    color *= 1.0 - dim * (.55 + .4 * smoothstep(.15, .85, r));
    // Walking through: the centre opens first, edged with gold light.
    float radius = hole * 1.35 - .2;
    float alpha = smoothstep(radius, radius + .2, r);
    if (entrance > .5) {
      // Open the actual doorway in photo 31, not a circle in the middle of the screen.
      // UV coordinates keep the threshold attached to the building while we approach it.
      vec2 doorway = abs(vUv - vec2(.455, .24));
      vec2 opening = mix(vec2(.047, .115), vec2(1.2), smoothstep(.22, 1.0, hole));
      float edge = max(doorway.x - opening.x, doorway.y - opening.y);
      alpha = mix(1.0, smoothstep(-.012, .018, edge), smoothstep(0.0, .18, hole));
    }
    float rim = (1.0 - abs(alpha - .5) * 2.0) * step(.001, hole);
    color += vec3(1.0, .78, .42) * rim * .55;
    gl_FragColor = vec4(color, alpha * opacity);
    #include <colorspace_fragment>
  }
`;

type Props = { shot: Shot; progress: RefObject<number>; next?: Shot; onLoaded: (key: string) => void; onError: () => void };

/** One photograph rebuilt as a 3D surface. The camera stays put; the photo moves by its inverse pose. */
export function DepthPhoto({ shot, progress, next, onLoaded, onError }: Props) {
  const mesh = useRef<THREE.Mesh>(null);
  const field = useRef<DepthField | null>(null);
  const pose = useMemo(() => new THREE.Matrix4(), []);
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1, 220, 165);
    const uv = plane.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, -SKIRT + uv.getX(i) * (1 + SKIRT * 2), -SKIRT + uv.getY(i) * (1 + SKIRT * 2));
    // Positions are computed in the shader; a large bound keeps the mesh from being culled.
    plane.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    return plane;
  }, []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader, transparent: true, depthWrite: true, toneMapped: false,
    uniforms: {
      map: { value: null }, depthMap: { value: null }, near: { value: shot.near }, far: { value: shot.far },
      tanHalf: { value: TAN }, aspect: { value: PHOTO_ASPECT }, opacity: { value: 0 }, dim: { value: 0 }, hole: { value: 0 },
      edgeBlend: { value: 1 }, entrance: { value: shot.photo === 31 ? 1 : 0 }, resolution: { value: new THREE.Vector2(1, 1) },
    },
  }), [shot.near, shot.far, shot.photo]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  useEffect(() => {
    let disposed = false;
    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    const key = `${shot.photo}-${shot.from}`;
    let pending = 2;
    const done = () => { if (--pending === 0) onLoaded(key); };
    loader.load(photoUrl(shot.photo), (map) => {
      if (disposed) return map.dispose();
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;
      map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
      textures.push(map);
      material.uniforms.map.value = map;
      done();
    }, undefined, () => { if (!disposed) onError(); });
    loader.load(depthUrl(shot.photo), (map) => {
      if (disposed) return map.dispose();
      const image = map.image as HTMLImageElement;
      const canvas = document.createElement("canvas");
      canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext("2d", { willReadFrequently: true })!;
      context.drawImage(image, 0, 0);
      field.current = { width: image.width, height: image.height, data: context.getImageData(0, 0, image.width, image.height).data };
      map.colorSpace = THREE.NoColorSpace;
      map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
      map.minFilter = THREE.LinearFilter;
      map.generateMipmaps = false;
      textures.push(map);
      material.uniforms.depthMap.value = map;
      done();
    }, undefined, () => { if (!disposed) onError(); });
    return () => { disposed = true; textures.forEach((texture) => texture.dispose()); };
  }, [shot, material, onLoaded, onError]);

  useEffect(() => {
    const object = mesh.current;
    if (!object) return;
    // When the next photo overlaps, this one is drawn last, over a cleared depth buffer, as it opens up.
    object.onBeforeRender = (renderer) => { if (shot.photo === 31 || shot.photo === 34 || (object.material as THREE.ShaderMaterial).uniforms.hole.value > 0) renderer.clearDepth(); };
  }, [shot.photo]);

  useFrame(({ gl }) => {
    const object = mesh.current;
    if (!object) return;
    const material = object.material as THREE.ShaderMaterial;
    const p = progress.current;
    const ready = field.current && material.uniforms.map.value;
    const inside = p >= shot.from - .001 && p <= shot.to + .001;
    object.visible = Boolean(ready && inside);
    if (!object.visible) return;
    material.uniforms.dim.value = shotPose(field.current!, shot, p, pose);
    object.matrix.copy(pose).invert();
    object.matrixWorldNeedsUpdate = true;
    material.uniforms.opacity.value = shot.photo === 34 ? smooth(MALL.exit, MALL.gone, p) : 1;
    material.uniforms.hole.value = shot.photo === 31 ? smooth(MALL.enter, shot.to, p) : next && p > next.from ? smooth(next.from, shot.to, p) : 0;
    object.renderOrder = material.uniforms.hole.value > 0 ? 2 : 1;
    gl.getDrawingBufferSize(material.uniforms.resolution.value);
  });

  return <mesh ref={mesh} geometry={geometry} material={material} matrixAutoUpdate={false} frustumCulled={false} />;
}
