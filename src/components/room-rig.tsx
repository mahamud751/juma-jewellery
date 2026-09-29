"use client";

import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode, type Ref, type RefObject } from "react";
import * as THREE from "three";
import { EnvContext } from "@/components/jewels";
import { ROOMS, type RoomId } from "@/lib/sections";

/**
 * Only the two rooms nearest the camera are drawn and lit.
 *
 * Every light in a three.js scene is shaded on every pixel, so rooms place stand-in lights and a
 * fixed pool of real lights follows the rooms in play. Because the pool never changes size, rooms can
 * be hidden and shown freely without three.js recompiling a single shader.
 */

/** Rooms lit at once, and what each may use: one shadow-casting spot, one plain spot, two points. */
const SLOTS = 2;
const POINTS_PER_ROOM = 2;

type Kind = "spot" | "point";

/** A light's settings, placed in its room. `aim` is the spot's target, in the same room space. */
export class LightProxy extends THREE.Object3D {
  readonly aim = new THREE.Vector3();
  readonly color = new THREE.Color();
  intensity = 0;
  distance = 0;
  angle = Math.PI / 3;
  penumbra = 0;

  constructor(
    readonly kind: Kind = "point",
    readonly room: RoomId = "atelier",
    readonly shadow = false,
  ) {
    super();
  }
}

extend({ LightProxy });

declare module "@react-three/fiber" {
  interface ThreeElements {
    lightProxy: ThreeElement<typeof LightProxy>;
  }
}

type Registry = {
  add: (proxy: LightProxy) => void;
  remove: (proxy: LightProxy) => void;
  addRoom: (id: RoomId, group: THREE.Group) => () => void;
};

const RigContext = createContext<Registry | null>(null);

function assign<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** Registers the stand-in with the rig for as long as it is mounted, and hands it to the caller's ref. */
function useRegister(ref: Ref<LightProxy> | undefined) {
  const rig = useContext(RigContext);
  return useCallback(
    (proxy: LightProxy | null) => {
      assign(ref, proxy);
      if (!proxy || !rig) return;
      rig.add(proxy);
      return () => {
        rig.remove(proxy);
        assign(ref, null);
      };
    },
    [rig, ref],
  );
}

type Vec3 = readonly [number, number, number];
type Common = { ref?: Ref<LightProxy>; room: RoomId; position: Vec3; color: string; intensity: number; distance?: number };

/** A spot light in room space; `target` is in the same space. */
export function RigSpot({
  ref,
  room,
  target = [0, 0, 0],
  castShadow = false,
  ...props
}: Common & { target?: Vec3; angle: number; penumbra?: number; castShadow?: boolean }) {
  const register = useRegister(ref);
  return <lightProxy ref={register} args={["spot", room, castShadow]} aim={target} {...props} />;
}

export function RigPoint({ ref, room, ...props }: Common) {
  const register = useRegister(ref);
  return <lightProxy ref={register} args={["point", room, false]} {...props} />;
}

/** A room's geometry; hidden whenever the room is not one of the two in play. Keep real lights out of it. */
export function Room({ id, children }: { id: RoomId; children: ReactNode }) {
  const rig = useContext(RigContext);
  const register = useCallback((group: THREE.Group | null) => (group && rig ? rig.addRoom(id, group) : undefined), [rig, id]);
  return <group ref={register}>{children}</group>;
}

const ROOM_IDS = Object.keys(ROOMS) as RoomId[];

/** How many chapters away the camera is from a room; 0 inside its range. */
function gap(room: RoomId, section: number) {
  const [from, to] = ROOMS[room];
  return section < from ? from - section : section > to ? section - to : 0;
}

function copySpot(light: THREE.SpotLight, proxy: LightProxy | undefined) {
  if (!proxy?.parent) {
    light.intensity = 0;
    return;
  }
  proxy.getWorldPosition(light.position);
  light.target.position.copy(proxy.aim).applyMatrix4(proxy.parent.matrixWorld);
  light.target.updateMatrixWorld();
  light.color.copy(proxy.color);
  light.intensity = proxy.intensity;
  light.distance = proxy.distance;
  light.angle = proxy.angle;
  light.penumbra = proxy.penumbra;
}

function copyPoint(light: THREE.PointLight, proxy: LightProxy | undefined) {
  if (!proxy?.parent) {
    light.intensity = 0;
    return;
  }
  proxy.getWorldPosition(light.position);
  light.color.copy(proxy.color);
  light.intensity = proxy.intensity;
  light.distance = proxy.distance;
}

/** Culls rooms and drives the light pool. `sectionRef` is the camera's eased position along the chapters. */
export function RoomRig({
  sectionRef,
  warmUp = false,
  children,
}: {
  sectionRef: RefObject<number>;
  warmUp?: boolean;
  children: ReactNode;
}) {
  const byRoom = useRef(new Map<RoomId, LightProxy[]>(ROOM_IDS.map((id) => [id, []])));
  const groups = useRef(new Map<THREE.Group, RoomId>());
  const slotRoom = useRef<(RoomId | null)[]>(Array(SLOTS).fill(null));
  const keySpots = useRef<(THREE.SpotLight | null)[]>([]);
  const spots = useRef<(THREE.SpotLight | null)[]>([]);
  const points = useRef<(THREE.PointLight | null)[]>([]);

  const registry = useMemo<Registry>(
    () => ({
      add(proxy) {
        const list = byRoom.current.get(proxy.room)!;
        list.push(proxy);
        const roomSpots = list.filter((p) => p.kind === "spot");
        if (
          roomSpots.filter((p) => p.shadow).length > 1 ||
          roomSpots.filter((p) => !p.shadow).length > 1 ||
          list.length - roomSpots.length > POINTS_PER_ROOM
        ) {
          console.warn(`LightRig: room "${proxy.room}" has more lights than the pool gives a room; extras stay dark.`);
        }
      },
      remove(proxy) {
        const list = byRoom.current.get(proxy.room)!;
        list.splice(list.indexOf(proxy), 1);
      },
      addRoom(id, group) {
        groups.current.set(group, id);
        return () => {
          groups.current.delete(group);
        };
      },
    }),
    [],
  );

  const env = useContext(EnvContext);
  const warmed = useRef(false);

  useFrame(({ gl, scene, camera }) => {
    // Once the stones have their studio map, compile every shader in the background with every room
    // shown for that one frame, so no room stalls on its first visit.
    if (warmUp && env && !warmed.current) {
      warmed.current = true;
      for (const group of groups.current.keys()) group.visible = true;
      void gl.compileAsync(scene, camera);
      return;
    }

    const section = sectionRef.current ?? 0;
    const wanted = [...ROOM_IDS].sort((a, b) => gap(a, section) - gap(b, section)).slice(0, SLOTS);
    const rooms = slotRoom.current;

    // A room keeps its slot while it stays wanted, so its shadow map stays valid.
    const fresh = Array<boolean>(SLOTS).fill(false);
    for (let i = 0; i < SLOTS; i++) {
      const room = rooms[i];
      if (room && !wanted.includes(room)) rooms[i] = null;
    }
    for (const room of wanted) {
      if (rooms.includes(room)) continue;
      const free = rooms.indexOf(null);
      rooms[free] = room;
      fresh[free] = true;
    }

    for (const [group, id] of groups.current) group.visible = rooms.includes(id);

    for (let i = 0; i < SLOTS; i++) {
      const room = rooms[i];
      const lights = room ? byRoom.current.get(room)! : [];
      const roomSpots = lights.filter((p) => p.kind === "spot");
      const roomPoints = lights.filter((p) => p.kind === "point");

      const key = keySpots.current[i];
      if (key) {
        copySpot(key, roomSpots.find((p) => p.shadow));
        // Redraw shadows only while the room is in play, plus once whenever the slot changes hands.
        key.shadow.autoUpdate = room !== null && gap(room, section) < 1.2;
        if (fresh[i] || !key.shadow.map) key.shadow.needsUpdate = true;
      }
      const spot = spots.current[i];
      if (spot) copySpot(spot, roomSpots.find((p) => !p.shadow));
      for (let j = 0; j < POINTS_PER_ROOM; j++) {
        const point = points.current[i * POINTS_PER_ROOM + j];
        if (point) copyPoint(point, roomPoints[j]);
      }
    }
  });

  return (
    <RigContext.Provider value={registry}>
      {Array.from({ length: SLOTS }, (_, i) => (
        <group key={i}>
          <spotLight
            ref={(light) => {
              keySpots.current[i] = light;
            }}
            castShadow
            intensity={0}
          />
          <spotLight
            ref={(light) => {
              spots.current[i] = light;
            }}
            intensity={0}
          />
          {Array.from({ length: POINTS_PER_ROOM }, (_, j) => (
            <pointLight
              key={j}
              ref={(light) => {
                points.current[i * POINTS_PER_ROOM + j] = light;
              }}
              intensity={0}
            />
          ))}
        </group>
      ))}
      {children}
    </RigContext.Provider>
  );
}
