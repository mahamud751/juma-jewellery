"use client";

import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { Chain, Glow } from "@/components/jewels";
import { RigPoint, RigSpot, type LightProxy } from "@/components/room-rig";
import { NECK_TOP, clothStrip, hairLift, hairline, headPoint, neckline, torsoPath, torsoPoint, wrapSurface } from "@/lib/figure";
import { BENGAL_ORIGIN, BENGAL_YAW } from "@/lib/sections";

/** 22k gold reads deeper and warmer than the 18k used elsewhere in the house. */
const GOLD = "#e8b24e";
const RUBY = "#9c0f1c";
const SINDOOR = "#c0121c";
const CREAM = "#efe4cf";
const TERRACOTTA = "#7a3f27";

const FIGURE_SCALE = 2.55;
const PLINTH_H = 0.34;

const nearness = (section: number, index: number, span = 1.2) => 1 - Math.min(1, Math.abs(section - index) / span);

function Gold({ roughness = 0.2 }: { roughness?: number }) {
  return <meshStandardMaterial color={GOLD} metalness={1} roughness={roughness} envMapIntensity={1.7} />;
}

function Ruby() {
  return <meshPhysicalMaterial color={RUBY} roughness={0.04} clearcoat={1} clearcoatRoughness={0} envMapIntensity={2.4} />;
}

function Pearl() {
  return <meshPhysicalMaterial color="#f4ece0" roughness={0.25} sheen={1} sheenColor="#ffe9d6" clearcoat={0.8} />;
}

const FORWARD = new THREE.Vector3(0, 0, 1);

type Placement = { position: THREE.Vector3; facing?: THREE.Vector3; scale?: number | [number, number, number] };

/** One instanced mesh for many small identical parts. */
function Many({ items, children }: { items: Placement[]; children: ReactNode }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const helper = new THREE.Object3D();
    items.forEach((item, i) => {
      helper.position.copy(item.position);
      helper.quaternion.setFromUnitVectors(FORWARD, (item.facing ?? FORWARD).clone().normalize());
      const s = item.scale ?? 1;
      if (Array.isArray(s)) helper.scale.set(...s);
      else helper.scale.setScalar(s);
      helper.updateMatrix();
      target.setMatrixAt(i, helper.matrix);
    });
    target.instanceMatrix.needsUpdate = true;
    target.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, items.length]}>{children}</instancedMesh>;
}

/** Round gold locket with a cabochon ruby, granulated rim and a pearl drop. */
function Locket({ size = 1, ...props }: { size?: number } & Omit<ThreeElements["group"], "children">) {
  const granules = useMemo(
    () => Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return { position: new THREE.Vector3(Math.cos(a) * 0.027, Math.sin(a) * 0.027, 0.001) };
    }),
    [],
  );
  const petals = useMemo(
    () => Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return { position: new THREE.Vector3(Math.cos(a) * 0.015, Math.sin(a) * 0.015, 0.002), scale: [1, 1, 0.5] as [number, number, number] };
    }),
    [],
  );
  return (
    <group {...props} scale={size}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.024, 0.024, 0.003, 40]} />
        <Gold roughness={0.28} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.024, 0.0022, 8, 48]} />
        <Gold />
      </mesh>
      <Many items={granules}>
        <sphereGeometry args={[0.0026, 10, 8]} />
        <Gold />
      </Many>
      <Many items={petals}>
        <sphereGeometry args={[0.0042, 10, 8]} />
        <Gold roughness={0.16} />
      </Many>
      <mesh position={[0, 0, 0.003]} scale={[1, 1, 0.55]}>
        <sphereGeometry args={[0.009, 24, 16]} />
        <Ruby />
      </mesh>
      <mesh position={[0, -0.03, 0]}>
        <torusGeometry args={[0.003, 0.0009, 6, 16]} />
        <Gold />
      </mesh>
      <mesh position={[0, -0.041, 0]} scale={[0.8, 1.25, 0.8]}>
        <sphereGeometry args={[0.0075, 16, 12]} />
        <Pearl />
      </mesh>
    </group>
  );
}

/** Bell earring: ruby stud, domed bell and a fringe of gold beads, swaying a little. */
function Jhumko({ side, reduced }: { side: 1 | -1; reduced: boolean }) {
  const swing = useRef<THREE.Group>(null);
  const lobe = useMemo(() => headPoint(side * (Math.PI / 2 + 0.12), 1.95, 0.004), [side]);
  const bell = useMemo(
    () => new THREE.LatheGeometry(
      [
        [0.0, 0.0],
        [0.004, -0.001],
        [0.009, -0.006],
        [0.013, -0.014],
        [0.016, -0.024],
        [0.0175, -0.03],
        [0.0165, -0.031],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      40,
    ),
    [],
  );
  const beads = useMemo(
    () => Array.from({ length: 20 }, (_, i) => {
      const a = (i / 20) * Math.PI * 2;
      return { position: new THREE.Vector3(Math.cos(a) * 0.017, -0.034, Math.sin(a) * 0.017) };
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (!swing.current || reduced) return;
    const t = clock.elapsedTime;
    swing.current.rotation.z = Math.sin(t * 1.4 + side) * 0.05;
    swing.current.rotation.x = Math.sin(t * 1.1 + side * 2) * 0.04;
  });

  return (
    <group position={lobe}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0075, 0.0075, 0.002, 24]} />
        <Gold />
      </mesh>
      <mesh position={[side * 0.0015, 0, 0]} scale={[0.5, 1, 1]}>
        <sphereGeometry args={[0.0045, 16, 12]} />
        <Ruby />
      </mesh>
      <group ref={swing}>
        <mesh position={[0, -0.011, 0]}>
          <torusGeometry args={[0.003, 0.0009, 6, 16]} />
          <Gold />
        </mesh>
        <group position={[0, -0.016, 0]}>
          <mesh position={[0, -0.001, 0]}>
            <sphereGeometry args={[0.0055, 16, 12]} />
            <Gold roughness={0.16} />
          </mesh>
          <mesh geometry={bell}>
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} envMapIntensity={1.7} side={THREE.DoubleSide} />
          </mesh>
          <Many items={beads}>
            <sphereGeometry args={[0.0024, 10, 8]} />
            <Gold />
          </Many>
          <mesh position={[0, -0.043, 0]} scale={[0.8, 1.2, 0.8]}>
            <sphereGeometry args={[0.005, 14, 10]} />
            <Pearl />
          </mesh>
        </group>
      </group>
    </group>
  );
}

const CHIK_Y = 0.505;
const chikRim = (dy: number) => torsoPath([[-Math.PI, CHIK_Y + dy], [0, CHIK_Y + dy], [Math.PI, CHIK_Y + dy]], 0.005).curve;

/** Chik: a ruby-set gold collar close around the neck, with small drops below. */
function Chik() {
  const { tiles, gems, drops } = useMemo(() => {
    const y = CHIK_Y;
    const tiles: Placement[] = [];
    const gems: Placement[] = [];
    const drops: Placement[] = [];
    const count = 15;
    for (let i = 0; i < count; i++) {
      const phi = -1.45 + (i / (count - 1)) * 2.9;
      const n = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi));
      tiles.push({ position: torsoPoint(phi, y, 0.004), facing: n });
      gems.push({ position: torsoPoint(phi, y, 0.0075), facing: n, scale: [1, 1, 0.5] });
      drops.push({ position: torsoPoint(phi, y - 0.017, 0.006), facing: n, scale: [0.75, 1.3, 0.6] });
    }
    return { tiles, gems, drops };
  }, []);
  const rims = useMemo(() => [chikRim(0.0105), chikRim(-0.0105)], []);

  return (
    <group>
      {rims.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 120, 0.0016, 6, false]} />
          <Gold />
        </mesh>
      ))}
      <Many items={tiles}>
        <boxGeometry args={[0.013, 0.018, 0.003]} />
        <Gold roughness={0.3} />
      </Many>
      <Many items={gems}>
        <sphereGeometry args={[0.0045, 14, 10]} />
        <Ruby />
      </Many>
      <Many items={drops}>
        <sphereGeometry args={[0.004, 12, 10]} />
        <Gold roughness={0.16} />
      </Many>
    </group>
  );
}

/** Graded strand around the neck, resting on the chest with its low point at `low`. */
function strandPath(low: number, lift: number) {
  const controls: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const phi = -Math.PI + (i / 24) * Math.PI * 2;
    const w = Math.min(1, Math.abs(phi) / 1.45);
    controls.push([phi, low + (0.47 - low) * Math.pow(w, 1.6)]);
  }
  return torsoPath(controls, lift).curve;
}

/** Sita haar: three graded gold strands, beads on the middle one, a locket on the longest. */
function SitaHaar() {
  const strands = useMemo(() => [strandPath(0.36, 0.006), strandPath(0.3, 0.007), strandPath(0.225, 0.008)], []);
  const beads = useMemo(
    () => strands[1].getSpacedPoints(44).slice(0, -1).map((position) => ({ position })),
    [strands],
  );
  const locket = useMemo(() => torsoPoint(0, 0.2, 0.012), []);

  return (
    <group>
      {strands.map((curve, i) => (
        <Chain key={i} curve={curve} links={150} size={0.0034} color={GOLD} />
      ))}
      <Many items={beads}>
        <sphereGeometry args={[0.0042, 12, 10]} />
        <Gold roughness={0.16} />
      </Many>
      <Locket position={locket} rotation={[-0.18, 0, 0]} size={1.15} />
    </group>
  );
}

/** Tikli: a chain down the parting, two more along the hairline, and a pendant on the brow. */
function Tikli() {
  const { parting, left, right, pendant } = useMemo(() => {
    // Chains ride just above the hair wherever the hair is.
    const onHead = (phi: number, theta: number, lift: number) => headPoint(phi, theta, hairLift(phi, theta) + lift);
    const parting = new THREE.CatmullRomCurve3(Array.from({ length: 10 }, (_, i) => onHead(0, 0.45 + (i / 9) * 0.8, 0.004)));
    const side = (sign: number) =>
      new THREE.CatmullRomCurve3(
        Array.from({ length: 10 }, (_, i) => {
          const phi = sign * (i / 9) * 1.05;
          return onHead(phi, hairline(phi) - 0.02 + (i / 9) * 0.1, 0.003);
        }),
      );
    return { parting, left: side(1), right: side(-1), pendant: headPoint(0, 1.33, 0.006) };
  }, []);

  return (
    <group>
      <Chain curve={parting} links={46} size={0.0024} color={GOLD} />
      <Chain curve={left} links={40} size={0.0021} color={GOLD} />
      <Chain curve={right} links={40} size={0.0021} color={GOLD} />
      <Locket position={pendant} rotation={[-0.32, 0, 0]} size={0.5} />
    </group>
  );
}

/** Low khopa bun at the nape, ringed twice with a jasmine gajra. */
const BUN = new THREE.Vector3(0, 0.605, -0.1);

function Khopa() {
  const buds = useMemo(() => {
    const out: Placement[] = [];
    for (const [radius, count, z] of [[0.064, 34, -0.006], [0.05, 26, -0.02]] as const) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + radius * 40;
        const outward = new THREE.Vector3(Math.cos(a), Math.sin(a), -0.6);
        out.push({ position: new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, z), facing: outward, scale: [0.8, 0.8, 1.5] });
      }
    }
    return out;
  }, []);

  return (
    <group position={BUN}>
      <mesh scale={[1.15, 0.95, 0.75]}>
        <sphereGeometry args={[0.042, 32, 24]} />
        <Hair />
      </mesh>
      <mesh position={[0, 0, -0.006]}>
        <torusGeometry args={[0.042, 0.017, 16, 48]} />
        <Hair />
      </mesh>
      <Many items={buds}>
        <sphereGeometry args={[0.0062, 10, 8]} />
        <meshStandardMaterial color="#fbf6ea" roughness={0.5} emissive="#fff4dc" emissiveIntensity={0.18} />
      </Many>
    </group>
  );
}

function Skin() {
  return <meshPhysicalMaterial color="#7b4a2e" roughness={0.5} sheen={0.5} sheenColor="#ffb98f" sheenRoughness={0.5} clearcoat={0.15} clearcoatRoughness={0.6} envMapIntensity={0.35} />;
}

function Hair() {
  return <meshPhysicalMaterial color="#0c0807" roughness={0.42} sheen={0.8} sheenColor="#5a3a2a" sheenRoughness={0.35} envMapIntensity={0.4} />;
}

/** The figure: a sculpted, faceless woman in a red blouse and laal-paar aanchal, dressed in bridal gold. */
function Figure({ reduced }: { reduced: boolean }) {
  const turn = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const body = wrapSurface((phi, v, out) => torsoPoint(phi, v * NECK_TOP, 0, out), 112, 110);
    const blouse = wrapSurface((phi, v, out) => torsoPoint(phi, 0.1 + v * (neckline(phi) - 0.1), 0.0028, out), 112, 70);
    const wrap = wrapSurface((phi, v, out) => torsoPoint(phi, v * 0.115, 0.0042, out), 112, 12);
    const head = wrapSurface((phi, v, out) => headPoint(phi, (1 - v) * Math.PI, 0, out), 72, 56);
    const hair = wrapSurface((phi, v, out) => {
      const theta = (1 - v) * hairline(phi);
      return headPoint(phi, theta, hairLift(phi, theta), out);
    }, 72, 44);
    const trim = torsoPath(
      Array.from({ length: 49 }, (_, i) => {
        const phi = -Math.PI + (i / 48) * Math.PI * 2;
        return [phi, neckline(phi)] as const;
      }),
      0.0034,
    ).curve;
    const sindoor = new THREE.CatmullRomCurve3(
      Array.from({ length: 8 }, (_, i) => {
        const theta = 0.2 + (i / 7) * 0.93;
        return headPoint(0, theta, hairLift(0, theta) + 0.0012);
      }),
    );
    // Aanchal over the left shoulder: down the back, across the shoulder, then diagonally to the right hip.
    const aanchal = clothStrip(
      [
        [2.55, 0.08],
        [2.15, 0.3],
        [1.72, 0.43],
        [1.4, 0.448],
        [1.08, 0.36],
        [0.78, 0.22],
        [0.42, 0.1],
        [0.0, 0.04],
        [-0.5, 0.015],
        [-0.95, 0.005],
      ],
      0.1,
      0.0065,
      [
        [0, RUBY],
        [0.1, RUBY],
        [0.1, GOLD],
        [0.13, GOLD],
        [0.13, CREAM],
        [0.3, CREAM],
        [0.5, CREAM],
        [0.7, CREAM],
        [0.87, CREAM],
        [0.87, GOLD],
        [0.9, GOLD],
        [0.9, RUBY],
        [1, RUBY],
      ],
    );
    return { body, blouse, wrap, head, hair, trim, sindoor, aanchal };
  }, []);

  useFrame(({ clock }) => {
    if (!turn.current) return;
    // A slow, breathing half-turn so the bun and gajra catch the light.
    turn.current.rotation.y = -0.28 + (reduced ? 0 : Math.sin(clock.elapsedTime * 0.22) * 0.32);
  });

  return (
    <group ref={turn}>
      <group scale={FIGURE_SCALE} position={[0, PLINTH_H + 0.03 * FIGURE_SCALE, 0]}>
        <mesh geometry={geometry.body} castShadow receiveShadow>
          <Skin />
        </mesh>
        <mesh geometry={geometry.head} castShadow>
          <Skin />
        </mesh>
        <mesh geometry={geometry.blouse} castShadow>
          <meshPhysicalMaterial color="#8e0d18" roughness={0.55} sheen={1} sheenColor="#ff6a5a" sheenRoughness={0.4} envMapIntensity={0.3} />
        </mesh>
        <mesh geometry={geometry.wrap}>
          <meshPhysicalMaterial color={CREAM} roughness={0.7} sheen={0.6} sheenColor="#fff4e0" envMapIntensity={0.3} />
        </mesh>
        <mesh geometry={geometry.aanchal} castShadow>
          <meshPhysicalMaterial vertexColors roughness={0.62} sheen={0.7} sheenColor="#fff1dc" sheenRoughness={0.45} side={THREE.DoubleSide} envMapIntensity={0.3} />
        </mesh>
        <mesh>
          <tubeGeometry args={[geometry.trim, 200, 0.0022, 6, true]} />
          <Gold roughness={0.3} />
        </mesh>
        <mesh geometry={geometry.hair}>
          <Hair />
        </mesh>
        <mesh>
          <tubeGeometry args={[geometry.sindoor, 40, 0.0032, 6, false]} />
          <meshStandardMaterial color={SINDOOR} roughness={0.6} emissive={SINDOOR} emissiveIntensity={0.25} />
        </mesh>
        <Khopa />
        <Tikli />
        <Jhumko side={1} reduced={reduced} />
        <Jhumko side={-1} reduced={reduced} />
        <Chik />
        <SitaHaar />
        {/* display base under the waist cut */}
        <mesh position={[0, -0.015, 0]} scale={[1, 1, 0.8]}>
          <cylinderGeometry args={[0.15, 0.16, 0.03, 64]} />
          <meshStandardMaterial color="#120a08" roughness={0.35} metalness={0.4} envMapIntensity={0.05} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.8, 1]}>
          <torusGeometry args={[0.15, 0.0025, 8, 96]} />
          <Gold />
        </mesh>
      </group>
    </group>
  );
}

/** Shakha (conch), pola (coral) and a gold bangle stacked on a small post. */
const BANGLES = (() => {
  const stack = [
    { r: 0.09, tube: 0.013, kind: "pola" },
    { r: 0.09, tube: 0.016, kind: "shakha" },
    { r: 0.088, tube: 0.008, kind: "gold" },
    { r: 0.09, tube: 0.016, kind: "shakha" },
    { r: 0.09, tube: 0.013, kind: "pola" },
  ] as const;
  let y = 0.02;
  return stack.map((b) => {
    const at = y + b.tube * 1.05;
    y = at + b.tube * 1.05;
    return { ...b, y: at };
  });
})();

function ShakhaPola(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.022, 0.03, 0.2, 24]} />
        <meshPhysicalMaterial color="#1c0d0a" roughness={0.3} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0.215, 0]}>
        <sphereGeometry args={[0.022, 20, 14]} />
        <Gold />
      </mesh>
      {BANGLES.map((b, i) => {
        return (
          <mesh key={i} position={[0, b.y, 0]} rotation={[Math.PI / 2, 0, i * 0.4]}>
            <torusGeometry args={[b.r, b.tube, 16, 72]} />
            {b.kind === "pola" ? (
              <meshPhysicalMaterial color="#a3101c" roughness={0.18} clearcoat={1} clearcoatRoughness={0.1} />
            ) : b.kind === "shakha" ? (
              <meshPhysicalMaterial color="#f1e9da" roughness={0.38} sheen={0.6} sheenColor="#ffffff" clearcoat={0.5} />
            ) : (
              <Gold />
            )}
          </mesh>
        );
      })}
    </group>
  );
}

/** Alpona: white rice-paste floor painting with a ring of sindoor dots. */
function Alpona({ size = 4.6 }: { size?: number }) {
  const texture = useMemo(() => {
    const px = 1024;
    const c = px / 2;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = px;
    const ctx = canvas.getContext("2d")!;
    const white = "rgba(246, 238, 224, 0.92)";
    ctx.strokeStyle = white;
    ctx.fillStyle = white;
    ctx.lineCap = "round";

    const ring = (r: number, width: number) => {
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.stroke();
    };

    ring(186, 5);
    // lotus petals
    const petals = 16;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(a);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 190);
      ctx.bezierCurveTo(-46, 222, -30, 268, 0, 292);
      ctx.bezierCurveTo(30, 268, 46, 222, 0, 190);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 204);
      ctx.bezierCurveTo(-18, 228, -12, 256, 0, 272);
      ctx.bezierCurveTo(12, 256, 18, 228, 0, 204);
      ctx.fill();
      ctx.restore();
    }
    ring(304, 4);
    // sindoor dots
    ctx.fillStyle = "rgba(196, 22, 30, 0.95)";
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(c + Math.cos(a) * 320, c + Math.sin(a) * 320, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = white;
    // scalloped band
    const scallops = 32;
    ctx.lineWidth = 5;
    for (let i = 0; i < scallops; i++) {
      const a0 = (i / scallops) * Math.PI * 2;
      const a1 = ((i + 1) / scallops) * Math.PI * 2;
      const mid = (a0 + a1) / 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a0) * 338, c + Math.sin(a0) * 338);
      ctx.quadraticCurveTo(c + Math.cos(mid) * 388, c + Math.sin(mid) * 388, c + Math.cos(a1) * 338, c + Math.sin(a1) * 338);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(c + Math.cos(mid) * 356, c + Math.sin(mid) * 356, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ring(338, 3);
    // outer vine of leaves with curling tendrils
    const leaves = 24;
    for (let i = 0; i < leaves; i++) {
      const a = (i / leaves) * Math.PI * 2;
      ctx.save();
      ctx.translate(c + Math.cos(a) * 430, c + Math.sin(a) * 430);
      ctx.rotate(a + Math.PI / 2);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.quadraticCurveTo(0, -24, 26, 0);
      ctx.quadraticCurveTo(0, 24, -26, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.bezierCurveTo(44, -4, 50, -22, 38, -26);
      ctx.stroke();
      ctx.restore();
    }
    ring(474, 5);
    ring(490, 2.5);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={texture} transparent depthWrite={false} roughness={0.9} color="#d9cdb8" polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  );
}

/** A terracotta diya with a living flame. */
function Diya({ seed, reduced, ...props }: { seed: number; reduced: boolean } & ThreeElements["group"]) {
  const flame = useRef<THREE.Group>(null);
  const bowl = useMemo(
    () => new THREE.LatheGeometry(
      [
        [0.0, 0.0],
        [0.035, 0.002],
        [0.058, 0.018],
        [0.066, 0.036],
        [0.06, 0.038],
        [0.05, 0.026],
        [0.0, 0.024],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      32,
    ),
    [],
  );

  useFrame(({ clock }) => {
    const f = flame.current;
    if (!f || reduced) return;
    const t = clock.elapsedTime * 7 + seed * 13.1;
    const flick = 0.85 + 0.1 * Math.sin(t) + 0.06 * Math.sin(t * 2.7 + 1.3) + 0.04 * Math.sin(t * 5.3);
    f.scale.set(1, flick, 1);
    f.rotation.z = Math.sin(t * 0.6) * 0.08;
  });

  return (
    <group {...props}>
      <mesh geometry={bowl} castShadow receiveShadow>
        <meshStandardMaterial color="#9a4f2c" roughness={0.85} />
      </mesh>
      <group ref={flame} position={[0.028, 0.032, 0]}>
        <mesh position={[0, 0.03, 0]} scale={[0.55, 1.35, 0.55]}>
          <sphereGeometry args={[0.02, 16, 12]} />
          <meshBasicMaterial color={new THREE.Color("#ffa640").multiplyScalar(1.6)} toneMapped={false} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0.024, 0]} scale={[0.4, 0.9, 0.4]}>
          <sphereGeometry args={[0.016, 12, 10]} />
          <meshBasicMaterial color={new THREE.Color("#fff3c8").multiplyScalar(3)} toneMapped={false} />
        </mesh>
      </group>
      <Glow position={[0.028, 0.002, 0]} size={0.45} opacity={0.5} color="#ff8a2a" />
    </group>
  );
}

/** Bishnupur-style terracotta wall: a cusped arch, relief plaques and a curved chala cornice. */
function TempleWall() {
  const wall = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-5, 0);
    shape.lineTo(5, 0);
    shape.lineTo(5, 5.6);
    shape.lineTo(-5, 5.6);
    shape.closePath();

    const arch = new THREE.Path();
    const half = 1.35;
    const spring = 1.95;
    arch.moveTo(-half, 0);
    arch.lineTo(-half, spring);
    const lobes = 7;
    const steps = 140;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const a = Math.PI - u * Math.PI;
      const r = half * (1 - 0.07 * (1 - Math.abs(Math.sin(u * lobes * Math.PI))));
      arch.lineTo(Math.cos(a) * r, spring + Math.sin(a) * r * 1.05);
    }
    arch.lineTo(half, 0);
    arch.closePath();
    shape.holes.push(arch);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: false, curveSegments: 4 });
  }, []);

  const cornice = useMemo(() => {
    const shape = new THREE.Shape();
    const top = (x: number) => 5.15 - 0.5 * (x / 5.2) ** 2;
    shape.moveTo(-5.2, top(-5.2) - 0.3);
    for (let i = 0; i <= 40; i++) {
      const x = -5.2 + (i / 40) * 10.4;
      shape.lineTo(x, top(x));
    }
    for (let i = 40; i >= 0; i--) {
      const x = -5.2 + (i / 40) * 10.4;
      shape.lineTo(x, top(x) - 0.3);
    }
    return new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
  }, []);

  // One column of plaques beside each pilaster and a frieze over the arch; the rest of the wall stays plain behind the copy.
  const plaques = useMemo(() => {
    const out: Placement[] = [];
    for (const side of [-1, 1]) {
      for (let row = 0; row < 5; row++) out.push({ position: new THREE.Vector3(side * 2.02, 0.7 + row * 0.68, 0.03) });
    }
    for (let i = 0; i < 9; i++) out.push({ position: new THREE.Vector3(-1.8 + i * 0.45, 3.78, 0.03), scale: 0.62 });
    return out;
  }, []);
  // Each plaque carries a carved eight-petal lotus.
  const petals = useMemo(() => {
    const out: Placement[] = [];
    for (const p of plaques) {
      const s = typeof p.scale === "number" ? p.scale : 1;
      const centre = p.position.clone().add(new THREE.Vector3(0, 0, 0.03));
      out.push({ position: centre, scale: [0.05 * s, 0.05 * s, 0.03 * s] });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
        // Long axis along the radius; half of each petal sinks into the plaque.
        out.push({ position: centre.clone().addScaledVector(dir, 0.12 * s), facing: dir, scale: [0.032 * s, 0.032 * s, 0.085 * s] });
      }
    }
    return out;
  }, [plaques]);

  const recess = useMemo(
    () => ({
      uLow: { value: new THREE.Color("#ff8a3a") },
      uMid: { value: new THREE.Color("#7a1f12") },
      uTop: { value: new THREE.Color("#140605") },
    }),
    [],
  );

  const clay = { color: TERRACOTTA, roughness: 0.92, metalness: 0 };

  return (
    <group position={[0, 0, -2.7]}>
      <mesh geometry={wall} receiveShadow>
        <meshStandardMaterial {...clay} />
      </mesh>
      <mesh geometry={cornice} position={[0, 0, 0]}>
        <meshStandardMaterial color="#6e3822" roughness={0.9} />
      </mesh>
      {/* the plaques sit on the wall's front face, which the extrusion puts at z = 0.35 */}
      <group position={[0, 0, 0.35]}>
        <Many items={plaques}>
          <boxGeometry args={[0.56, 0.56, 0.06]} />
          <meshStandardMaterial color="#7c4028" roughness={0.95} />
        </Many>
        <Many items={petals}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color="#8f4e2d" roughness={0.9} />
        </Many>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 1.55, 0, 0.06]}>
            <mesh position={[0, 1.05, 0]}>
              <boxGeometry args={[0.24, 2.1, 0.12]} />
              <meshStandardMaterial color="#7a3f27" roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.16, 0.02]}>
              <boxGeometry args={[0.36, 0.14, 0.18]} />
              <meshStandardMaterial color="#6a3521" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
      {/* recess behind the arch, glowing like lamplight on a sanctum wall */}
      <mesh position={[0, 1.9, -0.45]}>
        <planeGeometry args={[3.2, 4]} />
        <shaderMaterial
          uniforms={recess}
          toneMapped={false}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`varying vec2 vUv; uniform vec3 uLow; uniform vec3 uMid; uniform vec3 uTop;
            void main(){
              float y = vUv.y;
              vec3 col = mix(uLow, uMid, smoothstep(0.0, 0.4, y));
              col = mix(col, uTop, smoothstep(0.4, 0.95, y));
              float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
              gl_FragColor = vec4(col * (0.3 + 0.7 * edge), 1.0);
            }`}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.4, 1.9, -0.1]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.7, 4]} />
          <meshStandardMaterial color="#4a1c10" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Chapter VII: a Bengali bride's gold, shown on a sculpted figure before a terracotta temple arch.
 * The shared studio map is violet; this room's cloth, lacquer and stone keep their reflections low so it stays lamp-warm.
 */
export function BengalStage({ sectionRef, reduced }: { sectionRef: RefObject<number>; reduced: boolean }) {
  const key = useRef<LightProxy>(null);
  const lamp = useRef<LightProxy>(null);

  const diyas = useMemo(() => {
    const ring = Array.from({ length: 9 }, (_, i) => {
      const a = Math.PI * (1.12 + (i / 8) * 0.76);
      return [Math.cos(a) * 1.3, Math.sin(a) * 1.3 - 0.1] as const;
    });
    return [...ring, [-1.65, 1.35], [1.65, 1.35], [-2.05, 0.7], [2.05, 0.7]] as const;
  }, []);

  useFrame(({ clock }) => {
    const near = nearness(sectionRef.current ?? 0, 6);
    if (key.current) key.current.intensity = 12 + near * 46;
    if (lamp.current) {
      const t = clock.elapsedTime * 6;
      const flick = reduced ? 1 : 0.9 + 0.08 * Math.sin(t) + 0.05 * Math.sin(t * 2.3 + 0.7);
      lamp.current.intensity = (1.5 + near * 3.5) * flick;
    }
  });

  return (
    <group position={BENGAL_ORIGIN} rotation={[0, BENGAL_YAW, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.55]} receiveShadow>
        <planeGeometry args={[10, 8.6]} />
        <meshStandardMaterial color="#0d0806" metalness={0.35} roughness={0.55} envMapIntensity={0.03} />
      </mesh>
      <TempleWall />
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 4.85, 2.8, -0.5]}>
          <boxGeometry args={[0.3, 5.6, 4.6]} />
          <meshStandardMaterial color="#3a1c12" roughness={0.92} />
        </mesh>
      ))}

      <Alpona />

      {/* lacquered plinth with a gold lip */}
      <mesh position={[0, PLINTH_H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.78, 0.82, PLINTH_H, 96]} />
        <meshStandardMaterial color="#241009" roughness={0.5} metalness={0.1} envMapIntensity={0.03} />
      </mesh>
      <mesh position={[0, PLINTH_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.008, 8, 128]} />
        <Gold />
      </mesh>
      <Glow position={[0, PLINTH_H + 0.005, 0]} size={1.8} opacity={0.35} color="#ffb36b" />

      <Figure reduced={reduced} />
      <ShakhaPola position={[0.52, PLINTH_H, 0.42]} />

      {diyas.map(([x, z], i) => (
        <Diya key={i} seed={i} reduced={reduced} position={[x, 0, z]} rotation={[0, i * 1.7, 0]} scale={1.35} />
      ))}

      <RigSpot ref={key} room="bengal" position={[-1.8, 4.4, 3]} target={[0, 1.45, 0]} angle={0.42} penumbra={0.85} intensity={40} distance={11} color="#ffd9ad" castShadow />
      <RigSpot room="bengal" position={[0.6, 5.2, 1.4]} target={[0.3, 2.2, -2.4]} angle={0.46} penumbra={1} intensity={20} distance={10} color="#ff9d5c" />
      <RigPoint ref={lamp} room="bengal" position={[0, 0.45, -1.15]} intensity={4} distance={4.5} color="#ff9440" />
    </group>
  );
}
