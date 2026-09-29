export const SECTION_COUNT = 8;

export type SectionCopy = {
  id: string;
  title: string;
  desc: string;
  highlight: string;
  place: "inter" | "s1" | "s2" | "s3" | "l" | "r";
  /** When set, the highlight becomes a link into the site. */
  href?: string;
};

export const CHAPTERS: SectionCopy[] = [
  {
    id: "stillness",
    title: "THE ART \nOF STILLNESS.",
    desc: "In the heart of the motion, there is a center. GRAIR is that center. A balance of light and shadow.",
    highlight: "STRENGTH IN SILENCE.",
    place: "inter",
  },
  {
    id: "instinct",
    title: "Instinct \nRefined.",
    desc: "Strength does not raise its voice. It waits. It chooses. It moves only when necessary.",
    highlight: "GRAIR is not worn. It is inhabited.",
    place: "s1",
  },
  {
    id: "presence",
    title: "PRESENCE, \nIN FORM.",
    desc: "Every surface is deliberate. Every edge considered. GRAIR exists between restraint and desire.",
    highlight: "ONE DIAMOND. INFINITE CONTROL.",
    place: "s2",
  },
  {
    id: "constant",
    title: "Endless, \nBy Design.",
    desc: "Stones set edge to edge, with no beginning and no end. The Constant collection turns without ever repeating itself.",
    highlight: "The Constant Collection",
    place: "l",
    href: "/collections/constant",
  },
  {
    id: "nocturne",
    title: "After Dark, \nHigh Jewellery.",
    desc: "Six one-of-one pieces, each built around a violet diamond found once in a generation. Shown by appointment only.",
    highlight: "Enter Nocturne",
    place: "r",
    href: "/collections/nocturne",
  },
  {
    id: "bengal",
    title: "Adorned, \nThe Bengal Way.",
    desc: "Tikli at the parting, jhumko at the ear, shakha and pola at the wrist. The bridal gold of Bengal, worn as it has been for generations.",
    highlight: "Heritage is the rarest stone.",
    place: "l",
  },
  {
    id: "names",
    title: "Some Names \nDo Not Fade.",
    desc: "GRAIR is not a collection. It is a constant.",
    highlight: "Discover the Collections",
    place: "s3",
    href: "/collections",
  },
];

/** The chapters each room is seen in. The light rig keeps only the two rooms nearest the camera lit. */
export const ROOMS = {
  atelier: [0, 2],
  gallery: [3, 3],
  constant: [4, 4],
  nocturne: [5, 5],
  bengal: [6, 6],
  chamber: [7, 7],
} as const;

export type RoomId = keyof typeof ROOMS;

type Vec3 = readonly [number, number, number];
type Shot = { position: Vec3; target: Vec3 };

export const GALLERY_ORIGIN = [14, 0, -8] as const;
export const CHAMBER_ORIGIN = [6.6, 0, 13.9] as const;

/**
 * A room is built facing +z in its own space, then turned by `yaw`.
 * The yaw points each room back toward the previous shot, so the camera flies
 * in through the open front and never crosses a wall.
 */
export const CONSTANT_ORIGIN = [25, 0, 1] as const;
export const CONSTANT_YAW = Math.atan2(16.57 - 25, -10.95 - 1);
export const NOCTURNE_ORIGIN = [20, 0, 16.5] as const;

function roomShot(origin: Vec3, yaw: number, distance: number, height: number, look: number, side: number): Shot {
  const dir = [Math.sin(yaw), Math.cos(yaw)];
  const right = [Math.cos(yaw), -Math.sin(yaw)];
  return {
    position: [origin[0] + dir[0] * distance, height, origin[2] + dir[1] * distance],
    // Shift the aim sideways so the subject sits opposite the copy.
    target: [origin[0] - right[0] * side, look, origin[2] - right[1] * side],
  };
}

const constantShot = roomShot(CONSTANT_ORIGIN, CONSTANT_YAW, 6.4, 2.1, 0.75, 1.25);
export const NOCTURNE_YAW = Math.atan2(constantShot.position[0] - NOCTURNE_ORIGIN[0], constantShot.position[2] - NOCTURNE_ORIGIN[2]);
const nocturneShot = roomShot(NOCTURNE_ORIGIN, NOCTURNE_YAW, 7.6, 1.9, 1.75, -0.15);

/** The Bengal room faces the vault's camera; the flight out to the names chamber passes in front of it. */
export const BENGAL_ORIGIN = [11, 0, 4.5] as const;
export const BENGAL_YAW = Math.atan2(nocturneShot.position[0] - BENGAL_ORIGIN[0], nocturneShot.position[2] - BENGAL_ORIGIN[2]);
const bengalShot = roomShot(BENGAL_ORIGIN, BENGAL_YAW, 6.6, 1.65, 1.22, 1.35);

/**
 * Camera shots in world space. The camera looks along −z at `target`.
 * Shots 3 onward are separate rooms: gallery, turntable, vault, Bengal, names chamber.
 * Targets sit off the jewel so the stone lands left or right of center and the type keeps its dark field.
 */
export const SHOTS: Shot[] = [
  { position: [0, 0.42, 7.35], target: [0, 0.38, 0] },
  { position: [0.12, 0.34, 5.1], target: [0, 0.3, 0] },
  { position: [2.72, 0.22, 2.85], target: [1.05, -0.18, 0.15] },
  { position: [16.57, 1.58, -10.95], target: [13.69, 1.08, -8.48] },
  constantShot,
  nocturneShot,
  bengalShot,
  { position: [11.56, 2.06, 13.15], target: [7.46, 1.48, 14.64] },
];

/**
 * Seconds the camera takes to fly from one chapter to another: slow and even,
 * longer for the flights between rooms. The scroll stays locked for all of it.
 */
export function travelSeconds(from: number, to: number) {
  const a = Math.round(Math.min(from, to));
  const b = Math.round(Math.max(from, to));
  let distance = 0;
  for (let i = a; i < b; i++) {
    const p = SHOTS[i].position;
    const q = SHOTS[i + 1].position;
    distance += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  }
  return Math.min(4.2, 1.9 + distance * 0.11);
}
