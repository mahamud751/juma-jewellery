"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Studio } from "@/components/jewels";
import { DISPLAY_POSITIONS, SALON_STOPS, photoUrl, salonShot, type SalonVector } from "@/lib/salon";
import { GoldCreations, type LookState } from "./gold-creations";

type Props = { progress: RefObject<number>; look: RefObject<LookState>; active: number; reduced: boolean; onFailure: () => void; onReady: () => void };
const GOLD = { color: "#bea06b", metalness: .78, roughness: .27 };

function Block({ at, size, color = "#c7b99d", gold = false }: { at: SalonVector; size: SalonVector; color?: string; gold?: boolean }) {
  return <mesh position={at} receiveShadow><boxGeometry args={size} /><meshStandardMaterial {...(gold ? GOLD : { color, roughness: .62, metalness: .06 })} /></mesh>;
}
function Glow({ at, size }: { at: SalonVector; size: SalonVector }) {
  return <mesh position={at}><boxGeometry args={size} /><meshBasicMaterial color="#ffe4ab" /></mesh>;
}

function Photograph({ file, at, size, yaw = 0, progress, opening = false, onLoaded }: { file: number; at: SalonVector; size: [number, number]; yaw?: number; progress?: RefObject<number>; opening?: boolean; onLoaded?: () => void }) {
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    let disposed = false;
    let texture: THREE.Texture | undefined;
    new THREE.TextureLoader().load(photoUrl(file), (map) => {
      if (disposed) { map.dispose(); return; }
      texture = map;
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 4;
      if (material.current) { material.current.map = map; material.current.color.set("white"); material.current.needsUpdate = true; }
      invalidate();
      onLoaded?.();
    }, undefined, () => { if (!disposed) window.dispatchEvent(new Event("salon-image-error")); });
    return () => { disposed = true; texture?.dispose(); };
  }, [file, invalidate, onLoaded]);
  useFrame(({ size: viewport }) => {
    if (!opening || !progress) return;
    const opacity = 1 - THREE.MathUtils.smoothstep(progress.current, .12, .75);
    if (material.current) material.current.opacity = opacity;
    if (group.current) {
      group.current.visible = opacity > .001;
      group.current.scale.setScalar(Math.max(1, (viewport.width / viewport.height) * 19.52 / 30));
    }
  });
  return <group position={at} rotation={[0, yaw, 0]} ref={group}>
    {!opening && <Block at={[0, 0, -.055]} size={[size[0] + .17, size[1] + .17, .08]} gold />}
    <mesh renderOrder={opening ? 3 : 0}><planeGeometry args={size} /><meshBasicMaterial ref={material} color="#544533" transparent={opening} depthWrite={!opening} toneMapped={false} /></mesh>
  </group>;
}

function Sign({ text, at, width = 4, yaw = 0 }: { text: string; at: SalonVector; width?: number; yaw?: number }) {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#efd8a7"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "48px Georgia";
    ctx.fillText(text.split("").join(" "), 512, 80, 1000);
    return new THREE.CanvasTexture(canvas);
  }, [text]);
  useEffect(() => () => map.dispose(), [map]);
  return <mesh position={at} rotation={[0, yaw, 0]}><planeGeometry args={[width, width * .156]} /><meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} /></mesh>;
}

function Arch({ at, width = 3, height = 4.7 }: { at: SalonVector; width?: number; height?: number }) {
  const geometry = useMemo(() => {
    const r = width / 2;
    const points = [new THREE.Vector3(-r, 0, 0), new THREE.Vector3(-r, height - r, 0)];
    for (let i = 0; i <= 32; i++) {
      const a = Math.PI - i / 32 * Math.PI;
      points.push(new THREE.Vector3(Math.cos(a) * r, height - r + Math.sin(a) * r, 0));
    }
    points.push(new THREE.Vector3(r, 0, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false, "centripetal"), 72, .055, 8, false);
  }, [width, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={at} geometry={geometry}><meshStandardMaterial {...GOLD} /></mesh>;
}

function Doors({ progress }: { progress: RefObject<number> }) {
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null);
  useFrame(() => {
    const angle = THREE.MathUtils.smoothstep(progress.current, 2.02, 2.62) * Math.PI * .49;
    if (left.current) left.current.rotation.y = -angle;
    if (right.current) right.current.rotation.y = angle;
  });
  return <group position={[0, 0, 8]}>
    <Block at={[-2.4, 3, 0]} size={[.22, 6, .4]} gold /><Block at={[2.4, 3, 0]} size={[.22, 6, .4]} gold />
    <Block at={[0, 6, 0]} size={[5, .2, .4]} gold />
    <Sign text="JHUMA JEWELLERS" at={[0, 6.45, .18]} width={4.7} />
    {[-1, 1].map((side) => <group key={side} position={[side * 2.3, 0, 0]} ref={side < 0 ? left : right}>
      <group position={[-side * 1.15, 0, 0]}>
        <mesh position={[0, 3, 0]}><boxGeometry args={[2.27, 5.9, .045]} /><meshPhysicalMaterial color="#bfcbd0" transparent opacity={.16} metalness={.35} roughness={.08} depthWrite={false} /></mesh>
        {[-1, 1].map((edge) => <Block key={edge} at={[edge * 1.1, 3, .03]} size={[.06, 5.9, .12]} gold />)}
        {[.1, 1, 5.9].map((y) => <Block key={y} at={[0, y, .03]} size={[2.3, .06, .12]} gold />)}
        <Block at={[-side * .88, 2.8, .2]} size={[.08, 1.2, .26]} gold />
        <Sign text="J" at={[0, 4, .08]} width={.75} />
      </group>
    </group>)}
  </group>;
}

function Plinth({ index }: { index: number }) {
  const [x, , z] = DISPLAY_POSITIONS[index];
  return <group position={[x, 0, z]}>
    <mesh position={[0, .65, 0]} receiveShadow castShadow><cylinderGeometry args={[.84, .93, 1.3, 48]} /><meshStandardMaterial color="#111e31" roughness={.47} metalness={.12} /></mesh>
    {[.08, 1.27].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[.86, .86, .045, 48]} /><meshStandardMaterial {...GOLD} /></mesh>)}
    <mesh position={[0, 1.31, 0]} receiveShadow><cylinderGeometry args={[.8, .8, .04, 48]} /><meshStandardMaterial color="#071c38" roughness={.95} /></mesh>
    <Sign text={`0${index + 1}`} at={[0, .75, .87]} width={.38} />
    <mesh position={[0, .015, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.15, 1.17, 64]} /><meshStandardMaterial {...GOLD} /></mesh>
  </group>;
}

function SalonArchitecture() {
  return <>
    {/* A complete enclosed room: every direction has modeled walls and furnishings. */}
    <Block at={[0, -.16, -1]} size={[20, .3, 18]} color="#ac9d82" />
    <Block at={[0, 7.2, -1]} size={[20, .22, 18]} color="#4b4133" />
    <Block at={[-10, 3.5, -1]} size={[.25, 7.2, 18]} color="#aa9674" />
    <Block at={[10, 3.5, -1]} size={[.25, 7.2, 18]} color="#aa9674" />
    <Block at={[0, 3.5, -10]} size={[20, 7.2, .25]} color="#736045" />
    {[-1, 1].map((side) => <Block key={side} at={[side * 6.2, 3.5, 8]} size={[7.6, 7.2, .25]} color="#78684d" />)}
    <Block at={[0, 6.65, 8]} size={[4.7, 1.1, .25]} color="#78684d" />
    {[-8, -4, 0, 4, 8].map((x) => <Block key={x} at={[x, .004, -1]} size={[.018, .009, 18]} gold />)}
    {[-8, -4, 0, 4].map((z) => <Block key={z} at={[0, .006, z]} size={[20, .009, .018]} gold />)}
    {[-1, 1].map((side) => <group key={side}>
      <Glow at={[side * 9.7, 6.8, -1]} size={[.045, .05, 17.5]} />
      <Glow at={[0, 6.8, side < 0 ? -9.7 : 7.7]} size={[19.5, .05, .045]} />
      <Block at={[side * 9.8, .3, -1]} size={[.16, .32, 18]} gold />
      {/* Three-dimensional fluted panels, not painted lines. */}
      {Array.from({ length: 15 }, (_, i) => <Block key={i} at={[side * (3.3 + i * .43), 3.45, -9.75]} size={[.07, 6.5, .12]} gold />)}
      <group position={[side * 9.78, 0, -2]} rotation={[0, -side * Math.PI / 2, 0]}>
        <Block at={[0, 3.05, -.05]} size={[8, 5.8, .12]} color="#10263e" />
        <Photograph file={side < 0 ? 37 : 38} at={[0, 3.2, .07]} size={[6.4, 4.8]} />
        <Glow at={[0, .65, .18]} size={[7.8, .04, .08]} />
      </group>
      <group position={[side * 6.7, 0, 4.5]} rotation={[0, -side * .5, 0]}>
        <Block at={[0, .48, 0]} size={[3.3, .22, 1.4]} gold />
        <Block at={[0, .7, 0]} size={[3.4, .26, 1.5]} color="#29394c" />
        <Block at={[0, 1.18, -.58]} size={[3.4, .8, .24]} color="#29394c" />
        {[-1.3, 1.3].map((x) => <Block key={x} at={[x, .2, 0]} size={[.1, .4, 1]} gold />)}
      </group>
    </group>)}
    <Photograph file={36} at={[0, 3.7, -9.8]} size={[5.4, 4.05]} />
    <Sign text="THE JHUMA SALON" at={[0, 6.35, -9.7]} width={5} />
    {DISPLAY_POSITIONS.map((p, i) => <group key={i}>
      <Plinth index={i} />
      <group position={[p[0], 0, p[2] - 1.45]}>
        <Block at={[0, 2.9, -.08]} size={[2.8, 5.2, .14]} color="#132a44" />
        <Arch at={[0, .3, .05]} width={2.8} height={5.2} />
        <Glow at={[0, .32, .12]} size={[2.8, .03, .04]} />
      </group>
    </group>)}
    {[1.7, 2.6, 3.5].map((r, index) => <group key={r} position={[0, 6.25 + index * .18, -.5]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, .035, 8, 80]} /><meshStandardMaterial {...GOLD} /></mesh>
      <mesh position={[0, -.06, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, .012, 6, 80]} /><meshBasicMaterial color="#ffe5b3" /></mesh>
    </group>)}
    {/* Arrival gallery and the original frontage stay part of the same 3D world. */}
    <Block at={[0, -.15, 20]} size={[14, .3, 24]} color="#b8ab92" />
    <Block at={[0, 7.2, 16]} size={[14, .2, 16]} color="#a49474" />
    {[-1, 1].map((side) => <group key={side}>
      <Block at={[side * 7, 3.5, 16]} size={[.2, 7.2, 16]} color="#b7a485" />
      <Photograph file={side < 0 ? 34 : 35} at={[side * 6.85, 3.5, 14]} yaw={-side * Math.PI / 2} size={[7.2, 5.4]} />
      <Glow at={[side * 6.8, 6.9, 16]} size={[.04, .04, 16]} />
      <Glow at={[side * 2.8, .015, 18]} size={[.025, .018, 20]} />
      <Photograph file={35} at={[side * 5.8, 3.35, 8.18]} size={[4.5, 3.375]} />
    </group>)}
  </>;
}

function CameraRig({ progress, look, active, onFailure }: Props) {
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);
  const light = useRef<THREE.PointLight>(null);
  useEffect(() => {
    const wake = () => invalidate();
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    window.addEventListener("salon-scroll", wake);
    window.addEventListener("salon-image-error", onFailure);
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      window.removeEventListener("salon-scroll", wake);
      window.removeEventListener("salon-image-error", onFailure);
      gl.domElement.removeEventListener("webglcontextlost", lost);
    };
  }, [invalidate, gl, onFailure]);
  useFrame(({ camera, size }) => {
    const shot = salonShot(progress.current, size.width < 700);
    camera.position.set(...shot.position);
    const direction = new THREE.Vector3(...shot.target).sub(camera.position);
    // For products, rotate the solid model. For the room, turn the camera a full 360°.
    if (SALON_STOPS[active].piece === undefined) {
      const spherical = new THREE.Spherical().setFromVector3(direction);
      spherical.theta -= look.current.yaw;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + look.current.pitch, .15, Math.PI - .15);
      direction.setFromSpherical(spherical);
    }
    camera.lookAt(direction.add(camera.position));
    if (light.current) light.current.position.copy(camera.position).add(new THREE.Vector3(-2, 3, 1));
  }, -1);
  return <pointLight ref={light} intensity={60} color="#ffe8c7" distance={30} decay={2} />;
}

export default function SalonStage(props: Props) {
  return <Canvas shadows dpr={[1, 1.5]} frameloop="demand" camera={{ position: SALON_STOPS[0].position, fov: 52, near: .08, far: 85 }} gl={{ antialias: true, alpha: false }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1; }}>
    <color attach="background" args={["#302b23"]} />
    <ambientLight intensity={.7} color="#fff0d9" />
    <hemisphereLight args={["#fff2d9", "#5e6576", 1.5]} />
    <directionalLight position={[1, 9, 5]} intensity={2.3} color="#ffe9c4" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-normalBias={.04} />
    <pointLight position={[0, 5.7, -2]} intensity={120} distance={24} color="#fff0d2" />
    <Studio neutral resolution={256} />
    <CameraRig {...props} />
    <SalonArchitecture />
    <Doors progress={props.progress} />
    <GoldCreations active={props.active} look={props.look} progress={props.progress} reduced={props.reduced} />
    <Photograph file={31} at={[0, 3.2, 19]} size={[30, 22.5]} progress={props.progress} opening onLoaded={props.onReady} />
  </Canvas>;
}
