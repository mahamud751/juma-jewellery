"use client";

import { MeshReflectorMaterial, PerformanceMonitor, Sparkles, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { BengalStage } from "@/components/bengal";
import { NamesChamber } from "@/components/chamber";
import { PresenceGallery } from "@/components/gallery";
import { ConstantStage, NocturneVault } from "@/components/stages";
import { Diamond, EnvProvider, Glow, LaidNecklace, Solitaire, Studio } from "@/components/jewels";
import { usePlaster } from "@/components/plaster";
import { RigPoint, RigSpot, Room, RoomRig } from "@/components/room-rig";
import { washTexture } from "@/lib/plaster";
import { SHOTS, travelSeconds } from "@/lib/sections";


function LoadBridge({ onProgress }: { onProgress: (value: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => {
    onProgress(progress);
  }, [onProgress, progress]);
  return null;
}

function Rig({
  sectionRef,
  smoothRef,
  aboutRef,
  reduced,
}: {
  sectionRef: RefObject<number>;
  /** Written every frame: where the camera actually is along the chapters. */
  smoothRef: RefObject<number>;
  aboutRef: RefObject<boolean>;
  reduced: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const pointer = useThree((state) => state.pointer);
  const desired = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const lookNow = useRef(new THREE.Vector3(0, 0.38, 0));
  const flight = useRef({ from: 0, to: 0, start: 0, duration: 0 });

  useFrame(({ size, camera: lens, clock }, delta) => {
    // Portrait screens widen the lens so the stone keeps the same share of the frame.
    const aspect = size.width / size.height;
    const fov = aspect < 1 ? 30 + (1 - aspect) * 24 : 30;
    if (lens instanceof THREE.PerspectiveCamera && lens.fov !== fov) {
      lens.fov = fov;
      lens.updateProjectionMatrix();
    }

    // One timed flight per chapter change, eased in and out once over the whole
    // path, so a jump across several rooms is a single glide, not a stop at each.
    const target = sectionRef.current ?? 0;
    const now = clock.elapsedTime;
    const trip = flight.current;
    if (target !== trip.to) {
      trip.from = smoothRef.current;
      trip.to = target;
      trip.start = now;
      trip.duration = reduced ? 0 : travelSeconds(trip.from, target);
    }
    const t = trip.duration > 0 ? Math.min(1, (now - trip.start) / trip.duration) : 1;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    smoothRef.current = THREE.MathUtils.lerp(trip.from, trip.to, eased);

    const max = SHOTS.length - 1;
    const clamped = THREE.MathUtils.clamp(smoothRef.current, 0, max);
    const index = Math.min(max - 1, Math.floor(clamped));
    const shaped = clamped - index;
    const from = SHOTS[index];
    const to = SHOTS[index + 1];

    desired.current.set(
      THREE.MathUtils.lerp(from.position[0], to.position[0], shaped),
      THREE.MathUtils.lerp(from.position[1], to.position[1], shaped),
      THREE.MathUtils.lerp(from.position[2], to.position[2], shaped),
    );
    look.current.set(
      THREE.MathUtils.lerp(from.target[0], to.target[0], shaped),
      THREE.MathUtils.lerp(from.target[1], to.target[1], shaped),
      THREE.MathUtils.lerp(from.target[2], to.target[2], shaped),
    );

    if (!reduced) {
      desired.current.x += pointer.x * 0.16;
      desired.current.y += pointer.y * 0.08;
    }
    if (aboutRef.current) desired.current.z += 1.35;

    const follow = reduced ? 1 : 1 - Math.pow(0.04, delta);
    camera.position.lerp(desired.current, follow);
    lookNow.current.lerp(look.current, follow);
    camera.lookAt(lookNow.current);
  });

  return null;
}

/** Hero stone: floats above the plinth, table tipped toward the viewer, turning slowly. */
function HeroDiamond({ fancy, reduced }: { fancy: boolean; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const pointer = useThree((state) => state.pointer);

  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * (reduced ? 0.04 : 0.22);
    const g = group.current;
    if (!g) return;
    const tilt = 0.42 + (reduced ? 0 : pointer.y * 0.1);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, tilt, 0.04);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, reduced ? 0 : -pointer.x * 0.08, 0.04);
    g.position.y = 0.46 + Math.sin(performance.now() * 0.0007) * (reduced ? 0 : 0.05);
  });

  return (
    <group ref={group} position={[0, 0.46, 0]}>
      <group ref={spin}>
        <Diamond fancy={fancy} bounces={fancy ? 4 : 2} scale={0.86} />
      </group>
    </group>
  );
}

const CONCRETE = { color: "#0d0b12", roughness: 0.86, metalness: 0.12 };

function Atelier({ fancy }: { fancy: boolean }) {
  // Plaster walls; the side walls glow up from their floor coves.
  const plaster = usePlaster(7, 7);
  // A touch lighter than bare concrete so the plaster grain reads under the key light.
  const wall = { ...CONCRETE, ...plaster, color: "#30243f" };
  const coveWash = useMemo(() => washTexture("bottom"), []);
  const ceilingWash = useMemo(() => washTexture("top"), []);
  const portal = useMemo(
    () => ({
      uTop: { value: new THREE.Color("#05040a") },
      uMid: { value: new THREE.Color("#3a1a78") },
      uLow: { value: new THREE.Color("#8d5cff") },
    }),
    [],
  );

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, -1]} receiveShadow>
        <planeGeometry args={[12, 16]} />
        {fancy ? (
          <MeshReflectorMaterial
            resolution={256}
            blur={[320, 90]}
            mixBlur={1}
            mixStrength={1.4}
            mirror={0.6}
            roughness={0.72}
            metalness={0.5}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#08070c"
          />
        ) : (
          <meshStandardMaterial color="#09080d" metalness={0.7} roughness={0.4} />
        )}
      </mesh>

      {/* back wall with a tall portal cut through it */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 3.3, 2.5, -4.5]}>
          <boxGeometry args={[4.6, 7, 0.5]} />
          <meshStandardMaterial {...wall} emissive="#7954cd" emissiveMap={ceilingWash} emissiveIntensity={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 5.1, -4.5]}>
        <boxGeometry args={[2, 1.8, 0.5]} />
        <meshStandardMaterial {...wall} emissive="#7954cd" emissiveMap={ceilingWash} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 1.6, -6.4]}>
        <planeGeometry args={[4, 6]} />
        <shaderMaterial
          uniforms={portal}
          toneMapped={false}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`varying vec2 vUv; uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uLow;
            void main(){
              float y = vUv.y;
              vec3 col = mix(uLow, uMid, smoothstep(0.0, 0.35, y));
              col = mix(col, uTop, smoothstep(0.35, 0.95, y));
              float edge = smoothstep(0.0, 0.28, vUv.x) * smoothstep(1.0, 0.72, vUv.x);
              gl_FragColor = vec4(col * (0.35 + 0.65 * edge), 1.0);
            }`}
        />
      </mesh>
      {/* portal reveal walls and a floor strip of light running out of it */}
      {[-1, 1].map((side) => (
        <mesh key={`r${side}`} position={[side * 1, 1.6, -5.45]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.9, 6]} />
          <meshStandardMaterial {...wall} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, -1.015, -5.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial color="#2a1450" toneMapped={false} />
      </mesh>

      {/* side walls with LED coves at the floor */}
      {[-1, 1].map((side) => (
        <group key={`w${side}`} position={[side * 4.6, 0, -1.5]}>
          <mesh position={[0, 2.5, 0]}>
            <boxGeometry args={[0.4, 7, 7]} />
            <meshStandardMaterial {...wall} emissive="#7954df" emissiveMap={coveWash} emissiveIntensity={0.95} />
          </mesh>
          <mesh position={[-side * 0.21, -0.94, 0]}>
            <boxGeometry args={[0.02, 0.03, 7]} />
            <meshBasicMaterial color="#b995ff" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* stone plinth with a halo cove */}
      <mesh position={[0, -0.87, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.62, 1.62, 0.3, 96]} />
        {/* Low env response: a polished dark stone, not a grey mirror of the ceiling light. */}
        <meshPhysicalMaterial color="#0f0d14" roughness={0.35} metalness={0.1} clearcoat={0.5} clearcoatRoughness={0.3} envMapIntensity={0.25} />
      </mesh>
      <mesh position={[0, -0.715, 0]}>
        <cylinderGeometry args={[1.64, 1.64, 0.012, 96]} />
        <meshPhysicalMaterial color="#20162f" metalness={0.25} roughness={0.38} clearcoat={0.35} envMapIntensity={0.3} />
      </mesh>
      <mesh position={[0, -1.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.66, 96]} />
        <meshBasicMaterial color="#9e72ff" toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <Glow position={[0, -1.0, 0]} size={5.2} opacity={0.35} color="#7a4dff" />
      <Glow position={[0, -0.7, 0]} size={2.2} opacity={0.4} color="#d9c6ff" />
    </>
  );
}

/** Lighting rig: a white key from above right, violet rim from the portal, cool fill. */
function Lights() {
  return (
    <>
      <RigSpot room="atelier" position={[2.6, 5.6, 3.2]} angle={0.38} penumbra={0.9} intensity={60} color="#f6f2ff" castShadow />
      <RigSpot room="atelier" position={[0, 1.8, -5.6]} angle={0.9} penumbra={1} intensity={30} color="#8a55ff" />
      <RigPoint room="atelier" position={[-2.6, 0.6, 1.6]} intensity={5} color="#4d6bff" distance={7} />
      <RigPoint room="atelier" position={[0, 1.8, 2.2]} intensity={4} color="#efe4ff" distance={6} />
    </>
  );
}

function Scene({
  sectionRef,
  aboutRef,
  fancy,
  reduced,
  onProgress,
}: {
  sectionRef: RefObject<number>;
  aboutRef: RefObject<boolean>;
  fancy: boolean;
  reduced: boolean;
  onProgress: (value: number) => void;
}) {
  const smoothRef = useRef(0);

  return (
    <>
      <color attach="background" args={["#050407"]} />
      <fog attach="fog" args={["#050407", 11, 30]} />
      <LoadBridge onProgress={onProgress} />
      <Rig sectionRef={sectionRef} smoothRef={smoothRef} aboutRef={aboutRef} reduced={reduced} />
      <Studio resolution={fancy ? 512 : 256} />
      {/* Real lights live outside the rooms: hiding one would change the light count and recompile every shader. */}
      <ambientLight intensity={0.12} />
      <EnvProvider>
        <RoomRig sectionRef={smoothRef} warmUp={fancy}>
          <Room id="atelier">
            <Lights />
            <Atelier fancy={fancy} />
            <HeroDiamond fancy={fancy} reduced={reduced} />
            <Solitaire fancy={fancy} position={[1.18, -0.3, 0.3]} rotation={[0, -0.55, 0]} />
            <LaidNecklace fancy={fancy} position={[-1.05, -0.705, 0.35]} rotation={[0, 0.5, 0]} scale={0.9} />
            <Sparkles count={fancy ? 40 : 16} scale={[7, 4, 7]} size={1.8} speed={reduced ? 0 : 0.22} color="#edd7fe" opacity={0.5} position={[0, 0.6, 0]} />
          </Room>
          <Room id="gallery">
            <PresenceGallery fancy={fancy} sectionRef={sectionRef} />
          </Room>
          <Room id="constant">
            <ConstantStage sectionRef={sectionRef} reduced={reduced} />
          </Room>
          <Room id="nocturne">
            <NocturneVault reduced={reduced} />
          </Room>
          <Room id="bengal">
            <BengalStage sectionRef={sectionRef} reduced={reduced} />
          </Room>
          <Room id="chamber">
            <NamesChamber fancy={fancy} reduced={reduced} sectionRef={sectionRef} />
          </Room>
        </RoomRig>
      </EnvProvider>
      {fancy ? (
        <EffectComposer enableNormalPass={false} multisampling={2}>
          <Bloom luminanceThreshold={1.2} luminanceSmoothing={0.15} mipmapBlur intensity={0.16} />
        </EffectComposer>
      ) : null}
    </>
  );
}

export default function Stage({
  sectionRef,
  aboutRef,
  fancy,
  reduced,
  paused,
  onProgress,
}: {
  sectionRef: RefObject<number>;
  aboutRef: RefObject<boolean>;
  fancy: boolean;
  reduced: boolean;
  paused: boolean;
  onProgress: (value: number) => void;
}) {
  const [lowRes, setLowRes] = useState(false);
  const effectiveLowRes = !fancy || lowRes;

  return (
    <Canvas
      className="webgl"
      shadows={fancy}
      dpr={effectiveLowRes ? 1 : [1, 1.5]}
      frameloop={paused ? "never" : "always"}
      // The effect composer renders into its own targets and antialiases there (multisampling).
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.42, 7.35], fov: 30, near: 0.1, far: 50 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.setClearColor("#050407");
      }}
    >
      {fancy ? (
        <PerformanceMonitor onDecline={() => setLowRes(true)} flipflops={2} onFallback={() => setLowRes(true)} />
      ) : null}
      <Scene
        sectionRef={sectionRef}
        aboutRef={aboutRef}
        fancy={fancy}
        reduced={reduced}
        onProgress={onProgress}
      />
    </Canvas>
  );
}
