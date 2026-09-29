"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { EnvProvider, Studio } from "@/components/jewels";
import { Jewel } from "@/components/models";
import { METALS, type Piece } from "@/lib/catalog";
import { BOUTIQUES, DOORS, ROOMS, displayPosition, sampleRoute, type Side, type Vec3 } from "@/lib/shop";

const BRASS = { color: "#b39864", metalness: .7, roughness: .34 };
// One small, shared stone map adds surface grain without image downloads.
const STONE_MAP = (() => {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 271;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const grain = seed / 4294967296;
      const vein = Math.exp(-Math.abs(Math.sin(x * .08 + y * .025 + Math.sin(y * .1) * .5)) * 35);
      const value = Math.round(230 + grain * 21 - vein * 24);
      const offset = (y * size + x) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.repeat.set(3, 3);
  texture.needsUpdate = true;
  return texture;
})();
type StageProps = { progress: RefObject<number>; reduced: boolean; active: number; look: number; selected: string | null; onSelect: (slug: string) => void };

function Block({ position, size, brass = false, color = "#544c40" }: { position: Vec3; size: Vec3; brass?: boolean; color?: string }) {
  return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial {...(brass ? BRASS : { color, roughness: .82, metalness: .08, map: STONE_MAP })} /></mesh>;
}

function LightStrip({ position, size, color = "#f3d9ad" }: { position: Vec3; size: Vec3; color?: string }) {
  return <mesh position={position}><boxGeometry args={size} /><meshBasicMaterial color={color} /></mesh>;
}

/** Show the centre of a photo inside a fixed frame. Landscape salon stills are 4:3 or 16:9. */
function fitCover(texture: THREE.Texture, frameAspect: number, imageAspect: number) {
  if (!frameAspect || !imageAspect) return;
  if (imageAspect > frameAspect) {
    const repeatX = frameAspect / imageAspect;
    texture.repeat.set(repeatX, 1);
    texture.offset.set((1 - repeatX) / 2, 0);
  } else {
    const repeatY = imageAspect / frameAspect;
    texture.repeat.set(1, repeatY);
    texture.offset.set(0, (1 - repeatY) / 2);
  }
}

/**
 * A salon photograph on a wall. PlaneGeometry faces local +z, so a north-wall
 * frame (no rotation) looks back toward the camera, which travels from +z.
 * West wall: yaw +π/2 turns that normal to world +x. East wall: yaw −π/2 turns it to world −x.
 */
function PhotoPlane({ url, position, size, rotation = [0, 0, 0], enabled }: { url: string; position: Vec3; size: [number, number]; rotation?: Vec3; enabled: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const [frameW, frameH] = size;
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let texture: THREE.Texture | undefined;
    const loader = new THREE.TextureLoader();
    loader.load(url, (map) => {
      if (disposed) { map.dispose(); return; }
      map.colorSpace = THREE.SRGBColorSpace;
      const image = map.image as { width?: number; height?: number };
      fitCover(map, frameW / frameH, (image.width ?? 0) / (image.height || 1));
      texture = map;
      if (material.current) {
        material.current.map = map;
        material.current.color.set("#ffffff");
        material.current.needsUpdate = true;
      }
      invalidate();
    });
    return () => {
      disposed = true;
      texture?.dispose();
      if (material.current) material.current.map = null;
    };
  }, [url, enabled, invalidate, frameW, frameH]);
  if (!enabled) return null;
  return <group position={position} rotation={rotation}>
    <mesh position={[0, 0, -.03]}><planeGeometry args={[size[0] + .14, size[1] + .14]} /><meshStandardMaterial {...BRASS} /></mesh>
    <mesh><planeGeometry args={size} /><meshBasicMaterial ref={material} color="#14120f" toneMapped={false} fog={false} /></mesh>
  </group>;
}

/** One salon film, played only while the camera is in its room. Demand-mode canvases need an invalidate per frame. */
function FilmPlane({ src, poster, position, size, playing }: { src: string; poster: string; position: Vec3; size: [number, number]; playing: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [frameW, frameH] = size;
  useEffect(() => {
    let disposed = false;
    let posterMap: THREE.Texture | undefined;
    let videoMap: THREE.VideoTexture | undefined;
    const video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.src = src;
    videoRef.current = video;
    const apply = (map: THREE.Texture, aspect: number) => {
      if (!material.current) return;
      fitCover(map, frameW / frameH, aspect);
      material.current.map = map;
      material.current.color.set("#ffffff");
      material.current.needsUpdate = true;
      invalidate();
    };
    new THREE.TextureLoader().load(poster, (map) => {
      if (disposed) { map.dispose(); return; }
      map.colorSpace = THREE.SRGBColorSpace;
      posterMap = map;
      const image = map.image as { width?: number; height?: number };
      if (!videoMap) apply(map, (image.width ?? 16) / (image.height || 9));
    });
    const showVideo = () => {
      if (disposed || video.videoWidth === 0) return;
      if (!videoMap) {
        videoMap = new THREE.VideoTexture(video);
        videoMap.colorSpace = THREE.SRGBColorSpace;
      }
      apply(videoMap, video.videoWidth / video.videoHeight);
    };
    video.addEventListener("loadeddata", showVideo);
    return () => {
      disposed = true;
      video.removeEventListener("loadeddata", showVideo);
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoMap?.dispose();
      posterMap?.dispose();
      videoRef.current = null;
      if (material.current) material.current.map = null;
    };
  }, [src, poster, invalidate, frameW, frameH]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!playing) { video.pause(); return; }
    const attempt = () => { video.play().catch(() => {}); };
    if (video.readyState >= 2) attempt();
    else video.addEventListener("loadeddata", attempt, { once: true });
  }, [playing]);
  useFrame(() => { if (playing && videoRef.current && !videoRef.current.paused) invalidate(); });
  return <group position={position}>
    <mesh position={[0, 0, -.03]}><planeGeometry args={[size[0] + .14, size[1] + .14]} /><meshStandardMaterial {...BRASS} /></mesh>
    <mesh><planeGeometry args={size} /><meshBasicMaterial ref={material} color="#14120f" toneMapped={false} fog={false} /></mesh>
  </group>;
}

function Sign({ label, position, width = 3, color = "#ead4ae", rotation = [0, 0, 0] }: { label: string; position: Vec3; width?: number; color?: string; rotation?: Vec3 }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 160;
    const context = canvas.getContext("2d")!;
    context.fillStyle = color;
    context.font = "48px Georgia, serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label.toUpperCase().split("").join(" "), 512, 80, 980);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [label, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position} rotation={rotation}><planeGeometry args={[width, width * .15625]} /><meshBasicMaterial map={texture} transparent depthWrite={false} /></mesh>;
}

/** An architectural opening, with no wall or invisible pane across its path. */
function Portal({ width = 4.4, height = 4.7 }: { width?: number; height?: number }) {
  return <>
    {[-1, 1].map((side) => <group key={side}>
      <Block position={[side * (width / 2 + .15), height / 2, 0]} size={[.28, height, .4]} brass />
      <LightStrip position={[side * (width / 2 - .035), height / 2, .22]} size={[.025, height - .1, .025]} />
    </group>)}
    <Block position={[0, height, 0]} size={[width + .6, .26, .4]} brass />
    <LightStrip position={[0, height - .12, .22]} size={[width, .025, .025]} />
  </>;
}

function Door({ index }: { index: number }) {
  const door = DOORS[index];
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const group = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    const distance = Math.hypot(camera.position.x - door.center[0], camera.position.z - door.center[2]);
    if (group.current) group.current.visible = distance < 25;
    const angle = (1 - THREE.MathUtils.smoothstep(distance, 2.6, 7)) * 1.52;
    if (left.current) left.current.rotation.y = -angle;
    if (right.current) right.current.rotation.y = angle;
  });
  const half = door.width / 2;
  return <group ref={group} position={door.center} rotation={[0, door.yaw, 0]}>
    <Portal width={door.width} />
    <Sign label={door.name} position={[0, 5.23, .24]} width={index === 0 ? 3.5 : 3.1} />
    <Sign label={door.name} position={[0, 5.23, -.24]} rotation={[0, Math.PI, 0]} width={3.1} />
    {[-1, 1].map((side) => <group key={side} ref={side === -1 ? left : right} position={[side * half, 0, 0]}>
      <group position={[-side * half / 2, 0, 0]}>
        <mesh position={[0, 2.3, 0]}><boxGeometry args={[half - .09, 4.5, .04]} /><meshStandardMaterial color={index === 4 ? "#786085" : "#c4b58e"} transparent opacity={index === 4 ? .24 : .1} metalness={.45} roughness={.2} depthWrite={false} /></mesh>
        {[-1, 1].map((edge) => <Block key={edge} position={[edge * (half / 2 - .025), 2.3, 0]} size={[.065, 4.6, .09]} brass />)}
        {[.07, 1.05, 4.53].map((y) => <Block key={y} position={[0, y, 0]} size={[half, .06, .09]} brass />)}
        <Block position={[-side * (half / 2 - .23), 2.15, .15]} size={[.045, .8, .18]} brass />
        <Sign label={index === 0 ? "J" : String(index).padStart(2, "0")} position={[0, 3.3, .04]} width={.7} />
      </group>
    </group>)}
  </group>;
}

const SIDES: { side: Side; position: Vec3; yaw: number }[] = [
  { side: "north", position: [0, 0, -7], yaw: 0 },
  { side: "south", position: [0, 0, 7], yaw: Math.PI },
  { side: "west", position: [-7, 0, 0], yaw: Math.PI / 2 },
  { side: "east", position: [7, 0, 0], yaw: -Math.PI / 2 },
];
// Each shared wall is built once, avoiding overlapping surfaces and flicker.
const WALL_KEYS = new Set<string>();
const ROOM_WALLS = ROOMS.map((room) => SIDES.filter((side) => {
  const key = `${room.center[0] + side.position[0]},${room.center[2] + side.position[2]}`;
  if (WALL_KEYS.has(key)) return false;
  WALL_KEYS.add(key);
  return true;
}));

function Wall({ doorway, color }: { doorway: boolean; color: string }) {
  return <>
    {doorway ? <>
      {[-1, 1].map((side) => <Block key={side} position={[side * 4.675, 3, 0]} size={[4.65, 6, .2]} color={color} />)}
      <Block position={[0, 5.4, 0]} size={[4.7, 1.2, .2]} color={color} />
    </> : <Block position={[0, 3, 0]} size={[14, 6, .2]} color={color} />}
    {[-5.7, -3.5, 3.5, 5.7].map((x) => <group key={x}>
      <Block position={[x, 2.8, .17]} size={[.13, 5.6, .12]} brass />
      <LightStrip position={[x + .11, 3.3, .18]} size={[.018, 2, .03]} />
    </group>)}
    <Block position={[0, 5.72, .2]} size={[14, .14, .25]} brass />
    {[-1, 1].map((side) => <LightStrip key={side} position={[side * 4.7, .12, .14]} size={[4.5, .025, .02]} />)}
  </>;
}

function RoomShell({ index, children }: { index: number; children: ReactNode }) {
  const room = ROOMS[index];
  const boutique = room.boutique === undefined ? undefined : BOUTIQUES[room.boutique];
  const group = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (group.current) group.current.visible = Math.hypot(camera.position.x - room.center[0], camera.position.z - room.center[2]) < 25;
  });
  const floor = boutique?.floor ?? "#786e5c";
  const accent = boutique?.color ?? "#dfc699";
  return <group ref={group} position={room.center}>
    <mesh position={[0, -.015, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14, 14]} /><meshStandardMaterial color={floor} map={STONE_MAP} roughness={.48} metalness={.2} /></mesh>
    <Block position={[0, 6, 0]} size={[14, .2, 14]} color="#282620" />
    {ROOM_WALLS[index].map((side) => <group key={side.side} position={side.position} rotation={[0, side.yaw, 0]}><Wall doorway={room.doors.includes(side.side)} color={boutique?.wall ?? "#554e42"} /></group>)}
    {/* Inlaid floor grid gives scale and makes sideways movement readable. */}
    {[-5.6, -2.8, 0, 2.8, 5.6].map((line) => <group key={line}>
      <LightStrip position={[line, .003, 0]} size={[.012, .008, 13.8]} color="#a18d69" />
      <LightStrip position={[0, .003, line]} size={[13.8, .008, .012]} color="#a18d69" />
    </group>)}
    {[-1, 1].map((side) => <group key={side}>
      <Block position={[side * 5.8, 5.6, 0]} size={[.1, .15, 11.6]} brass />
      <Block position={[0, 5.6, side * 5.8]} size={[11.6, .15, .1]} brass />
      <LightStrip position={[side * 5.7, 5.52, 0]} size={[.035, .02, 11.4]} color={accent} />
      <LightStrip position={[0, 5.52, side * 5.7]} size={[11.4, .02, .035]} color={accent} />
    </group>)}
    <mesh position={[0, 5.45, -1.5]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[2.8, .025, 6, 64]} /><meshBasicMaterial color={accent} /></mesh>
    <mesh position={[0, 5.5, -1.5]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[2.7, 48]} /><meshBasicMaterial color={accent} transparent opacity={.09} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    {children}
  </group>;
}

function Plinth({ index, count, color, selected, card, children, onSelect }: { index: number; count: number; color: string; selected: boolean; card?: string; children: ReactNode; onSelect: () => void }) {
  const [x, y, z] = displayPosition(index, count);
  return <group position={[x, 0, z]} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
    <Block position={[0, .62, 0]} size={[1.55, 1.24, 1.5]} color="#38332e" />
    <Block position={[0, 1.26, 0]} size={[1.61, .06, 1.56]} brass />
    <Block position={[0, 1.32, 0]} size={[1.42, .06, 1.35]} color="#16181a" />
    <LightStrip position={[0, .13, .76]} size={[1.45, .025, .015]} color={selected ? "#ffffff" : color} />
    <Sign label={String(index + 1).padStart(2, "0")} position={[0, .84, .757]} width={.5} />
    {card && <PhotoPlane url={card} position={[0, 2.28, -.82]} size={[1.46, 1.1]} enabled />}
    <group position={[0, y, 0]}>{children}</group>
    {/* Corner pins suggest a vitrine without another transparent render pass. */}
    {[-1, 1].map((side) => <Block key={side} position={[side * .75, 1.91, -.7]} size={[.018, 1.2, .018]} brass />)}
    {selected && <mesh position={[0, .025, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.98, 1.01, 48]} /><meshBasicMaterial color={color} /></mesh>}
  </group>;
}

function ProductRoom({ index, mounted, selected, onSelect }: { index: number; mounted: boolean; selected: string | null; onSelect: (slug: string) => void }) {
  const boutique = BOUTIQUES[index];
  const mobile = useThree((state) => state.size.width < 700);
  // Silence and Constant open north, so the wide still hangs on the solid side wall. Instinct and Nocturne have a solid north wall.
  const northDoor = index === 0 || index === 2;
  const mural = northDoor
    ? index === 0
      ? { position: [-6.7, 2.9, -1.2] as Vec3, rotation: [0, Math.PI / 2, 0] as Vec3 }
      : { position: [6.7, 2.9, -1.2] as Vec3, rotation: [0, -Math.PI / 2, 0] as Vec3 }
    : { position: [0, 2.95, -6.7] as Vec3, rotation: [0, 0, 0] as Vec3 };
  return <>
    <Sign label={boutique.name} position={[index === 0 || index === 2 ? -4.7 : 0, index === 0 || index === 2 ? 4.82 : 5.3, -6.65]} width={index === 0 || index === 2 ? 2.3 : 4.3} color={boutique.color} />
    <PhotoPlane url={boutique.backdrop} position={mural.position} rotation={mural.rotation} size={northDoor ? [4.2, 3.15] : [4.4, 3.3]} enabled={mounted} />
    {[-1, 1].map((side) => <group key={side} position={[side * 4.7, 2.95, -6.8]}>
      <Block position={[0, 0, 0]} size={[2.5, 1.9, .16]} color="#282522" />
      <PhotoPlane url={boutique.frames[side < 0 ? 0 : 1]} position={[0, 0, .11]} size={[2.2, 1.65]} enabled={mounted} />
      <LightStrip position={[0, -1.05, .18]} size={[2.5, .025, .025]} color={boutique.color} />
    </group>)}
    <group scale={[mobile ? .82 : 1, 1, 1]}>
      <Block position={[0, .08, -2.1]} size={[10.4, .16, 3.2]} color={index === 3 ? "#292031" : "#4e4435"} />
      {boutique.pieces.map((piece, pieceIndex) => <Plinth key={piece.slug} index={pieceIndex} count={boutique.pieces.length} color={boutique.color} card={mounted ? piece.card : undefined} selected={selected === piece.slug} onSelect={() => onSelect(piece.slug)}>
        {mounted && <Jewel model={piece.model} stone={piece.stone} metal={METALS[piece.metals[0]].color} fancy={false} scale={piece.model === "riviera" || piece.model === "pendant" ? .77 : .95} rotation={[.12, pieceIndex % 2 ? -.2 : .2, 0]} />}
      </Plinth>)}
    </group>
    <Sign label="JHUMA · ZINDABAZAR" position={[0, .22, -.48]} width={2.5} />
  </>;
}

function Bench({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <Block position={[0, .36, 0]} size={[2.6, .16, .9]} brass />
    <Block position={[0, .55, 0]} size={[2.7, .24, .98]} color="#776653" />
    {[-1, 1].map((side) => <Block key={side} position={[side, .18, 0]} size={[.12, .36, .7]} brass />)}
  </group>;
}

function Atrium({ mounted }: { mounted: boolean }) {
  return <>
    <Sign label="JHUMA JEWELLERS" position={[0, 5.05, -6.78]} width={5.2} />
    <Sign label="ZINDABAZAR" position={[0, 4.42, -6.78]} width={3.1} />
    <PhotoPlane url="/media/card/IMG_7141.jpg" position={[-3.75, 2.55, -6.72]} size={[3.2, 2.4]} enabled={mounted} />
    <PhotoPlane url="/media/card/IMG_7143.jpg" position={[3.75, 2.55, -6.72]} size={[3.2, 2.4]} enabled={mounted} />
    <PhotoPlane url="/media/card/IMG_7126.jpg" position={[6.7, 2.7, -1.1]} rotation={[0, -Math.PI / 2, 0]} size={[4.0, 3.0]} enabled={mounted} />
    <group position={[0, 0, -3.8]}>
      <mesh position={[0, .65, 0]}><cylinderGeometry args={[1.15, 1.25, 1.3, 48]} /><meshStandardMaterial color="#39352f" roughness={.5} /></mesh>
      <mesh position={[0, 1.32, 0]}><cylinderGeometry args={[1.18, 1.18, .055, 48]} /><meshStandardMaterial {...BRASS} /></mesh>
      <mesh position={[0, 2.65, 0]} rotation={[.2, .25, .3]}><torusGeometry args={[.93, .11, 12, 64]} /><meshStandardMaterial {...BRASS} /></mesh>
      <mesh position={[0, 2.65, 0]} rotation={[.5, -.6, -.5]}><torusGeometry args={[.93, .06, 8, 64]} /><meshStandardMaterial color="#ddd6c7" metalness={1} roughness={.25} /></mesh>
    </group>
    <Bench position={[4.8, 0, -.3]} rotation={Math.PI / 2} />
    <Bench position={[-4.7, 0, -4.8]} />
    <mesh position={[0, .015, .1]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[2.05, 2.08, 64]} /><meshBasicMaterial color="#c3a878" /></mesh>
    <Sign label="SILENCE ←" position={[-6.55, 3.35, 4.2]} rotation={[0, Math.PI / 2, 0]} width={2.2} />
  </>;
}

function Salon({ mounted, playing }: { mounted: boolean; playing: boolean }) {
  return <>
    <Sign label="THE PRIVATE SALON" position={[0, 5.05, -6.78]} width={4.8} />
    {mounted && <FilmPlane src="/media/films/IMG_7139.mp4" poster="/media/card/IMG_7139.jpg" position={[0, 2.85, -6.68]} size={[3.4, 1.91]} playing={playing} />}
    <PhotoPlane url="/media/card/IMG_7104.jpg" position={[-4.15, 2.85, -6.72]} size={[2.4, 1.8]} enabled={mounted} />
    <PhotoPlane url="/media/card/IMG_7115.jpg" position={[4.15, 2.85, -6.72]} size={[2.4, 1.8]} enabled={mounted} />
    <Block position={[0, .08, -1.3]} size={[9, .08, 7]} color="#4c4035" />
    <mesh position={[0, .9, -1.5]}><cylinderGeometry args={[1.7, 1.7, .15, 48]} /><meshStandardMaterial {...BRASS} /></mesh>
    <Block position={[0, .43, -1.5]} size={[.8, .86, .8]} color="#34312c" />
    {[-1, 1].map((side) => <group key={side} position={[side * 2.65, 0, -1.5]}>
      <Block position={[0, .52, 0]} size={[1.4, .75, 1.6]} color="#92775d" />
      <Block position={[side * .6, 1.12, 0]} size={[.22, 1.3, 1.6]} color="#92775d" />
      {[-1, 1].map((end) => <Block key={end} position={[0, .95, end * .7]} size={[1.4, .4, .18]} color="#92775d" />)}
    </group>)}
    <Block position={[0, 1.02, -1.5]} size={[.75, .08, .5]} color="#20201d" />
    <Bench position={[-4.5, 0, -5.5]} />
    <Bench position={[4.5, 0, -5.5]} />
  </>;
}

function CameraTravel({ progress, reduced, look, selected, active }: Omit<StageProps, "onSelect">) {
  const invalidate = useThree((state) => state.invalidate);
  const desired = useRef(new THREE.Vector3());
  const aim = useRef(new THREE.Vector3());
  const aimNow = useRef(new THREE.Vector3(0, 2.6, 4));
  const current = useRef(progress.current);
  const light = useRef<THREE.PointLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const ready = useRef(false);
  useEffect(() => {
    const wake = () => { if (!document.hidden) invalidate(); };
    window.addEventListener("shop-scroll", wake);
    document.addEventListener("visibilitychange", wake);
    invalidate();
    return () => { window.removeEventListener("shop-scroll", wake); document.removeEventListener("visibilitychange", wake); };
  }, [invalidate]);
  useEffect(() => { invalidate(); }, [look, selected, active, reduced, invalidate]);

  useFrame(({ camera, size }, delta) => {
    const destination = reduced ? Math.round(progress.current) : progress.current;
    current.current = reduced ? destination : THREE.MathUtils.damp(current.current, destination, 10, Math.min(delta, .05));
    const shot = sampleRoute(current.current);
    const mobile = size.width < 700;
    const yaw = shot.yaw + look;
    const pitch = shot.pitch + (mobile ? .08 : 0);
    desired.current.set(...shot.position);
    aim.current.set(shot.position[0] - Math.sin(yaw) * 8, shot.position[1] - pitch * 8, shot.position[2] - Math.cos(yaw) * 8);
    const boutique = BOUTIQUES[active - 2];
    const selectedIndex = boutique?.pieces.findIndex((piece: Piece) => piece.slug === selected) ?? -1;
    if (selectedIndex >= 0 && Math.abs(progress.current - active) < .35) {
      const room = ROOMS[active - 1];
      const [x, y, z] = displayPosition(selectedIndex, boutique.pieces.length);
      const worldX = room.center[0] + x * (mobile ? .82 : 1);
      desired.current.set(worldX + .5, y + .9, room.center[2] + z + (mobile ? 3.6 : 3.1));
      // Place the inspected piece above the bottom sheet on portrait screens.
      aim.current.set(worldX, y - (mobile ? 1 : 0), room.center[2] + z);
    }
    const follow = reduced || !ready.current ? 1 : 1 - Math.exp(-8 * Math.min(delta, .05));
    camera.position.lerp(desired.current, follow);
    aimNow.current.lerp(aim.current, follow);
    camera.lookAt(aimNow.current);
    ready.current = true;
    const unsettled = Math.abs(current.current - destination) > .0001 || camera.position.distanceToSquared(desired.current) > .000001 || aimNow.current.distanceToSquared(aim.current) > .000001;
    if (unsettled) invalidate();
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = selectedIndex >= 0 ? (mobile ? 54 : 44) : mobile ? 87 : 61;
      const next = THREE.MathUtils.lerp(camera.fov, fov, follow);
      if (Math.abs(camera.fov - fov) > .01) { camera.fov = next; camera.updateProjectionMatrix(); invalidate(); }
    }
    if (light.current) light.current.position.set(camera.position.x - 1.8, 5, camera.position.z - 2);
    if (fill.current) fill.current.position.set(camera.position.x + 3, 3.8, camera.position.z - 5);
  }, -1);
  return <><pointLight ref={light} intensity={95} distance={22} color="#fff1d8" decay={2} /><pointLight ref={fill} intensity={48} distance={18} color="#dce8ff" decay={2} /></>;
}

function Interior(props: StageProps) {
  return <>
    <color attach="background" args={["#181713"]} />
    <fog attach="fog" args={["#24221e", 22, 40]} />
    <ambientLight intensity={.85} color="#f6ecdc" />
    <hemisphereLight args={["#fff4df", "#6c6255", 1.15]} />
    <Studio neutral resolution={256} />
    <CameraTravel {...props} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.025, 13]}><planeGeometry args={[22, 12]} /><meshStandardMaterial color="#625b4f" roughness={.6} metalness={.15} /></mesh>
    {[-1, 1].map((side) => <group key={side} position={[side * 5.7, 0, 7.3]}>
      <Block position={[0, 2.8, 0]} size={[.45, 5.6, .6]} brass />
      <Sign label={side < 0 ? "JHUMA JEWELLERS" : "ZINDABAZAR"} position={[0, 4.55, .33]} width={2.2} />
    </group>)}
    {[-1, 1].map((side) => <PhotoPlane key={side} url={side < 0 ? "/media/card/IMG_7105.jpg" : "/media/card/IMG_7144.jpg"} position={[side * 3.95, 2.65, 7.24]} size={[2.5, 1.88]} enabled={props.active <= 1} />)}
    <EnvProvider>
      {ROOMS.map((room, index) => <RoomShell key={room.name} index={index}>
        {room.boutique === undefined ? index === 0 ? <Atrium mounted={Math.abs(props.active - room.stop) <= 1} /> : <Salon mounted={Math.abs(props.active - room.stop) <= 1} playing={props.active === room.stop} /> : <ProductRoom index={room.boutique} mounted={Math.abs(props.active - room.stop) <= 1} selected={props.selected} onSelect={props.onSelect} />}
      </RoomShell>)}
    </EnvProvider>
    {DOORS.map((door, index) => <Door key={door.name} index={index} />)}
  </>;
}

export default function ShopStage(props: StageProps) {
  return <Canvas dpr={1} frameloop="demand" camera={{ position: [0, 2.8, 14], fov: 61, near: .08, far: 48 }} gl={{ antialias: true, alpha: false, powerPreference: "default" }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}><Interior {...props} /></Canvas>;
}
