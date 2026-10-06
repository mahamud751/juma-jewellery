/**
 * The salon hall: ten chapters, one scroll each. Chapter 0 is the wide opening shot; every later
 * chapter is a display that opens as the camera lands on it, its own way: a box lid, cabinet doors,
 * a velvet curtain, a glass dome, a drawer, a table case. The hall runs down −z, with displays on
 * alternating walls so each flight turns from one wall, down the hall, to the other.
 */

export type Opening = "box" | "cabinet" | "curtain" | "dome" | "drawer" | "case" | "lounge";
export type Place = "inter" | "s1" | "s2" | "s3" | "l" | "r";
type Vec3 = [number, number, number];

export type Display = {
  opening: Opening;
  /** The salon photograph shown in it, and its height in metres. */
  src?: string;
  height: number;
  /** Floor point of the display and the way it faces (0 faces +z). */
  at: [number, number];
  yaw: number;
  /** Where the piece ends up once open: height, and how far it comes forward. */
  focusY: number;
  focusZ: number;
  /** +1 puts the piece right of centre (copy on the left), −1 left of centre. */
  side: 1 | -1 | 0;
  distance?: number;
  eye?: number;
  /** Brass plaque on the display. */
  plaque?: [string, string];
};

export type Chapter = {
  id: string;
  /** Short name for the rail and the header. */
  name: string;
  eyebrow: string;
  /** Two lines; the second is set in gold italic, as in the walk. */
  title: string;
  desc: string;
  bengali?: string;
  details?: string[];
  highlight: string;
  href?: string;
  /** Which side of the screen the copy takes; the piece takes the other. */
  place: "l" | "r";
};

export const HALL = { halfWidth: 3.6, height: 4.4, start: 18.5, end: -40.6 } as const;
const LEFT = Math.PI / 2;
const RIGHT = -Math.PI / 2;
const WALL_X = 3.15;

/** One per chapter after the opening shot: DISPLAYS[i] belongs to chapter i + 1. */
export const DISPLAYS: Display[] = [
  { opening: "box", src: "/media/full/IMG_7126.jpg", height: 1.02, at: [-1.2, 6], yaw: 0.35, focusY: 1.86, focusZ: 0, side: 1, distance: 4.9, plaque: ["Floral Har", "ফ্লোরাল হার"] },
  { opening: "cabinet", src: "/media/hero/chains.jpg", height: 1.3, at: [-WALL_X, 0], yaw: LEFT, focusY: 1.72, focusZ: 0.5, side: -1, plaque: ["The Chain Boards", "চেইন"] },
  { opening: "curtain", src: "/media/full/IMG_7121.jpg", height: 1.02, at: [WALL_X, -5], yaw: RIGHT, focusY: 1.86, focusZ: 0.42, side: 1, distance: 4.9, plaque: ["Lotus Cascade", "পদ্ম হার"] },
  { opening: "dome", src: "/media/hero/jhumka.jpg", height: 0.86, at: [-WALL_X + 0.15, -10], yaw: LEFT, focusY: 1.78, focusZ: 0.3, side: -1, plaque: ["Bell Jhumka", "ঝুমকা"] },
  { opening: "cabinet", src: "/media/hero/fan.jpg", height: 1.4, at: [WALL_X, -15], yaw: RIGHT, focusY: 1.74, focusZ: 0.5, side: 1, plaque: ["Fan Pendant", "পাখা লকেট"] },
  { opening: "curtain", src: "/media/full/IMG_7123.jpg", height: 1.02, at: [-WALL_X, -20], yaw: LEFT, focusY: 1.86, focusZ: 0.42, side: -1, distance: 4.9, plaque: ["Under the Arch", "খিলানের নিচে"] },
  { opening: "drawer", src: "/media/hero/rings.jpg", height: 0.86, at: [WALL_X - 0.1, -25], yaw: RIGHT, focusY: 1.5, focusZ: 0.86, side: 1, distance: 4.6, plaque: ["Gold Rings", "সোনার আংটি"] },
  { opening: "case", src: "/media/full/IMG_7131.jpg", height: 0.9, at: [-WALL_X + 0.1, -30], yaw: LEFT, focusY: 1.6, focusZ: 0.42, side: -1, distance: 4.4, plaque: ["The Earring Trays", "কানের দুল"] },
  { opening: "lounge", height: 1.4, at: [0, -37.6], yaw: 0, focusY: 1.3, focusZ: -0.6, side: 1, distance: 6.6, eye: 2.1 },
];

export const CHAPTERS: Chapter[] = [
  {
    id: "hall", name: "The hall", eyebrow: "The Jhuma hall",
    title: "Every case,\nopened.",
    desc: "Down the hall, case by case. Each one opens as you arrive, and the piece comes out to meet you.",
    highlight: "Open the first case", place: "l",
  },
  {
    id: "box", name: "Floral har", eyebrow: "Creation 01 · The jewellery box",
    title: "Opened,\njust for you.", bengali: "ফ্লোরাল হার", details: ["Yellow gold", "Necklace and jhumka", "The jewellery box"],
    desc: "A box on the velvet, and the lid lifted: the Floral Har, a filigree collar with its flower pendant and jhumka.",
    highlight: "The original piece", href: "/jewellery/floral-har", place: "l",
  },
  {
    id: "chains", name: "Chains", eyebrow: "Creation 02 · The chain cabinet",
    title: "Every chain,\nin its place.", bengali: "চেইন", details: ["Yellow gold", "Rope, box and floral", "The chain boards"],
    desc: "Rope, box and floral chains hang edge to edge on royal blue velvet, the way they are kept on the chain boards.",
    highlight: "The original piece", href: "/jewellery/chain-boards", place: "r",
  },
  {
    id: "lotus", name: "Lotus cascade", eyebrow: "Creation 03 · Behind the curtain",
    title: "Behind\nthe velvet.", bengali: "পদ্ম হার", details: ["Yellow gold", "Long sets", "Matching earrings"],
    desc: "The curtain parts on the Lotus Cascade: long gold sets on velvet busts, each with its matching earrings.",
    highlight: "The original piece", href: "/jewellery/lotus-cascade", place: "l",
  },
  {
    id: "jhumka", name: "Jhumka", eyebrow: "Creation 04 · Under the glass",
    title: "The bell\njhumka.", bengali: "ঝুমকা", details: ["Yellow gold", "Bell and beadwork", "A small drop"],
    desc: "A round gold bell, beadwork and a small drop, lifted out from under the glass so you can see every detail.",
    highlight: "All earrings", href: "/collections/earrings", place: "r",
  },
  {
    id: "fan", name: "Fan pendant", eyebrow: "Creation 05 · The alcove cabinet",
    title: "The fan\npendant.", bengali: "পাখা লকেট", details: ["Yellow gold", "Fringed haar", "Matching earrings"],
    desc: "A long haar with its pendant fringed in gold, and the earrings made to sit beside it.",
    highlight: "The original piece", href: "/jewellery/fan-pendant", place: "l",
  },
  {
    id: "arch", name: "Under the arch", eyebrow: "Creation 06 · Bridal sets",
    title: "Under\nthe arch.", bengali: "বিয়ের সেট", details: ["Yellow gold", "Bridal sets", "The carved arch"],
    desc: "Bridal sets stand together under the carved arch, lit the way they are in the salon.",
    highlight: "The original piece", href: "/jewellery/under-the-arch", place: "r",
  },
  {
    id: "rings", name: "Rings", eyebrow: "Creation 07 · The ring counter",
    title: "From the\nring counter.", bengali: "সোনার আংটি", details: ["Yellow gold", "Signet and band", "The ring counter"],
    desc: "The drawer slides open: signet rings and gold bands, each on its own blue cushion.",
    highlight: "All rings", href: "/collections/rings", place: "l",
  },
  {
    id: "earrings", name: "Earrings", eyebrow: "Creation 08 · The table case",
    title: "Tray\nby tray.", bengali: "কানের দুল", details: ["Yellow gold", "Studs and drops", "The earring trays"],
    desc: "The glass lifts on the earring trays: studs, drops and jhumka, row after row.",
    highlight: "The original piece", href: "/jewellery/earring-trays", place: "r",
  },
  {
    id: "viewing", name: "Private viewing", eyebrow: "Private viewing · Sylhet Plaza, 4th floor",
    title: "A seat is\nwaiting.",
    desc: "Book a private viewing and the pieces you choose will be ready when you arrive.",
    highlight: "Book a private viewing", href: "/appointment", place: "l",
  },
];

export const CHAPTER_COUNT = CHAPTERS.length;

/** Vertical lens: GRAIR's, widened on portrait screens so the piece keeps its share of the frame. */
export const fovFor = (aspect: number) => (aspect < 1 ? 30 + (1 - aspect) * 24 : 30);

const OVERTURE = { position: [0.6, 2.2, 16.2] as Vec3, target: [-2.3, 1.75, 6] as Vec3 };

export const facing = (yaw: number) => [Math.sin(yaw), Math.cos(yaw)] as const;

/** Where the piece of a chapter sits once its display is open. */
export function focusOf(chapter: number): Vec3 {
  const display = DISPLAYS[Math.max(0, chapter - 1)];
  const [nx, nz] = facing(display.yaw);
  return [display.at[0] + nx * display.focusZ, display.focusY, display.at[1] + nz * display.focusZ];
}

/**
 * The camera for a chapter. It stands square in front of the display; the aim is pushed sideways so
 * the piece lands opposite the copy. Portrait screens keep the copy low, so the piece is centred,
 * further away and higher in the frame.
 */
export function shotFor(chapter: number, aspect: number) {
  if (chapter <= 0) return OVERTURE;
  const display = DISPLAYS[chapter - 1];
  const portrait = aspect < 0.9;
  const [nx, nz] = facing(display.yaw);
  const right = [Math.cos(display.yaw), -Math.sin(display.yaw)];
  const focus = focusOf(chapter);
  const base = display.distance ?? Math.min(5.4, Math.max(3.2, display.height * 3.7 + 0.9));
  // Portrait backs off for width, but never through the far wall of the hall.
  const room = Math.abs(nx) > 0.01 ? (Math.sign(nx) * (HALL.halfWidth - 0.45) - focus[0]) / nx : Infinity;
  const distance = Math.min(base * (portrait ? 1.4 : 1), room);
  const half = Math.tan(((fovFor(aspect) / 2) * Math.PI) / 180);
  const shift = portrait ? 0 : display.side * 0.36 * distance * half * aspect;
  const lift = portrait ? 0.24 * distance * half : 0;
  return {
    position: [focus[0] + nx * distance, display.eye ?? focus[1] + 0.12, focus[2] + nz * distance] as Vec3,
    target: [focus[0] - right[0] * shift, focus[1] - 0.05 - lift, focus[2] - right[1] * shift] as Vec3,
  };
}

/** Seconds for a flight between chapters: slow and even, as on GRAIR, longer for longer walks. */
export function travelSeconds(from: number, to: number) {
  const a = Math.round(Math.min(from, to));
  const b = Math.round(Math.max(from, to));
  let distance = 0;
  for (let i = a; i < b; i++) {
    const p = shotFor(i, 1.6).position;
    const q = shotFor(i + 1, 1.6).position;
    distance += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  }
  return Math.min(4.4, 2 + distance * 0.1);
}
