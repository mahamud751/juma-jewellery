import { PIECES, type Piece } from "@/lib/catalog";

const take = (...slugs: string[]) =>
  slugs.map((slug) => PIECES.find((piece) => piece.slug === slug)).filter((piece): piece is Piece => Boolean(piece));

export const BOUTIQUES = [
  {
    name: "Silence",
    slug: "sets",
    subtitle: "The velvet alcove",
    description: "The real necklace sets, on royal blue. Walk up to a frame, then open the piece.",
    color: "#e7d7bb",
    wall: "#24324f",
    floor: "#6d6458",
    direction: "Left wing",
    backdrop: "/media/card/IMG_7119.jpg",
    frames: ["/media/card/IMG_7124.jpg", "/media/card/IMG_7123.jpg"],
    pieces: take("floral-har", "lotus-cascade", "fan-pendant", "alcove-sets", "under-the-arch"),
  },
  {
    name: "Instinct",
    slug: "chains",
    subtitle: "The gold chains",
    description: "Rope, box and floral chains, hung the way they are in the salon. The heavier gold is here.",
    color: "#e9b97c",
    wall: "#553c30",
    floor: "#80634f",
    direction: "Through the north doors",
    backdrop: "/media/card/IMG_7120.jpg",
    frames: ["/media/card/IMG_7112.jpg", "/media/card/IMG_7117.jpg"],
    pieces: take("chain-boards", "chains-across", "chains-return", "layered-chain", "heart-pendant"),
  },
  {
    name: "Constant",
    slug: "rings",
    subtitle: "The ring counter",
    description: "Signets and gold bands, one to a cushion. The counter from the salon, piece by piece.",
    color: "#b9cfdd",
    wall: "#2a3a52",
    floor: "#687675",
    direction: "Turn right",
    backdrop: "/media/card/IMG_7134.jpg",
    frames: ["/media/card/IMG_7135.jpg", "/media/card/IMG_7136.jpg"],
    pieces: take("ring-counter", "ring-counter-near", "ring-counter-wide", "rings-in-motion", "rings-pass"),
  },
  {
    name: "Nocturne",
    slug: "earrings",
    subtitle: "The earring trays",
    description: "Jhumka, drops and the pairs that sit with a necklace. Take your time along the trays.",
    color: "#c3a2db",
    wall: "#24324f",
    floor: "#65566f",
    direction: "Beyond the vault doors",
    backdrop: "/media/card/IMG_7130.jpg",
    frames: ["/media/card/IMG_7114.jpg", "/media/card/IMG_7131.jpg"],
    pieces: take("earring-trays", "earring-trays-near", "earring-busts", "earring-trays-film", "earring-trays-pass"),
  },
].map((boutique) => ({ ...boutique, href: `/collections/${boutique.slug}` }));

export const SHOP_STOPS = ["Entrance", "Grand atrium", ...BOUTIQUES.map((boutique) => boutique.name), "Private salon"];
export const SHOP_STEP = 2.4;
export type Vec3 = [number, number, number];
export type Side = "north" | "south" | "east" | "west";

export const ROOMS: { name: string; center: Vec3; doors: Side[]; stop: number; boutique?: number }[] = [
  { name: "Grand atrium", center: [0, 0, 0], doors: ["south", "west"], stop: 1 },
  { name: "Silence", center: [-14, 0, 0], doors: ["east", "north"], stop: 2, boutique: 0 },
  { name: "Instinct", center: [-14, 0, -14], doors: ["south", "east"], stop: 3, boutique: 1 },
  { name: "Constant", center: [0, 0, -14], doors: ["west", "north"], stop: 4, boutique: 2 },
  { name: "Nocturne", center: [0, 0, -28], doors: ["south", "east"], stop: 5, boutique: 3 },
  { name: "Private salon", center: [14, 0, -28], doors: ["west"], stop: 6 },
];

export const DOORS: { center: Vec3; yaw: number; name: string; crossing: number; width: number }[] = [
  { center: [0, 0, 7], yaw: 0, name: "JHUMA", crossing: .62, width: 4.4 },
  { center: [-7, 0, 0], yaw: Math.PI / 2, name: "Silence", crossing: 1.56, width: 4.4 },
  { center: [-14, 0, -7], yaw: 0, name: "Instinct", crossing: 2.64, width: 4.4 },
  { center: [-7, 0, -14], yaw: -Math.PI / 2, name: "Constant", crossing: 3.56, width: 4.4 },
  { center: [0, 0, -21], yaw: 0, name: "Nocturne", crossing: 4.65, width: 4.4 },
  { center: [7, 0, -28], yaw: -Math.PI / 2, name: "Private salon", crossing: 5.56, width: 4.4 },
];

// Waypoints cross the door centres and follow clear aisles around the counters.
export const ROUTE: { at: number; position: Vec3; yaw: number; pitch: number }[] = [
  { at: 0, position: [0, 2.8, 14], yaw: 0, pitch: .02 },
  { at: .4, position: [0, 2.8, 10], yaw: 0, pitch: .02 },
  { at: .7, position: [0, 2.8, 5.5], yaw: .1, pitch: .06 },
  { at: 1, position: [0, 2.8, 2.5], yaw: .85, pitch: .08 },
  { at: 1.28, position: [-2.8, 2.8, .4], yaw: Math.PI / 2, pitch: .06 },
  { at: 1.48, position: [-5.6, 2.8, 0], yaw: Math.PI / 2, pitch: .06 },
  { at: 1.66, position: [-8.5, 2.8, 0], yaw: 1.25, pitch: .08 },
  { at: 1.82, position: [-11.2, 3, 3], yaw: .5, pitch: .15 },
  { at: 2, position: [-14, 3.2, 5], yaw: 0, pitch: .17 },
  { at: 2.22, position: [-18.4, 3, 2], yaw: 0, pitch: .13 },
  { at: 2.42, position: [-18.5, 2.8, -4.6], yaw: -.5, pitch: .06 },
  { at: 2.56, position: [-14, 2.8, -5.7], yaw: 0, pitch: .06 },
  { at: 2.73, position: [-14, 2.8, -8.2], yaw: 0, pitch: .1 },
  { at: 3, position: [-14, 3.2, -9], yaw: 0, pitch: .17 },
  { at: 3.28, position: [-11.2, 2.8, -13.6], yaw: -Math.PI / 2, pitch: .06 },
  { at: 3.48, position: [-8.4, 2.8, -14], yaw: -Math.PI / 2, pitch: .06 },
  { at: 3.66, position: [-5.5, 2.8, -14], yaw: -1.25, pitch: .08 },
  { at: 3.82, position: [-2.8, 3, -11], yaw: -.5, pitch: .15 },
  { at: 4, position: [0, 3.2, -9], yaw: 0, pitch: .17 },
  { at: 4.22, position: [4.4, 3, -12], yaw: 0, pitch: .13 },
  { at: 4.42, position: [4.5, 2.8, -18.6], yaw: .5, pitch: .06 },
  { at: 4.56, position: [0, 2.8, -19.7], yaw: 0, pitch: .06 },
  { at: 4.73, position: [0, 2.8, -22.2], yaw: 0, pitch: .1 },
  { at: 5, position: [0, 3.2, -23], yaw: 0, pitch: .17 },
  { at: 5.28, position: [2.8, 2.8, -27.6], yaw: -Math.PI / 2, pitch: .06 },
  { at: 5.48, position: [5.6, 2.8, -28], yaw: -Math.PI / 2, pitch: .06 },
  { at: 5.66, position: [8.5, 2.8, -28], yaw: -1.25, pitch: .08 },
  { at: 5.82, position: [11.2, 3, -25], yaw: -.5, pitch: .15 },
  { at: 6, position: [14, 3.2, -23], yaw: 0, pitch: .15 },
];

/** Shared by the camera and floor plan without adding Three.js to the UI. */
export function sampleRoute(progress: number) {
  const value = Math.max(0, Math.min(6, progress));
  const index = Math.max(0, ROUTE.findIndex((point) => point.at >= value) - 1);
  const from = ROUTE[index];
  const to = ROUTE[index + 1];
  const t = Math.min(1, Math.max(0, (value - from.at) / (to.at - from.at)));
  const eased = t * t * (3 - 2 * t);
  return {
    position: from.position.map((coordinate, axis) => coordinate + (to.position[axis] - coordinate) * t) as Vec3,
    yaw: from.yaw + (to.yaw - from.yaw) * eased,
    pitch: from.pitch + (to.pitch - from.pitch) * eased,
  };
}

export function displayPosition(index: number, count: number): Vec3 {
  const x = (index - (count - 1) / 2) * 2.05;
  return [x, 1.9 + (index % 2 ? .18 : 0), -2.7 + Math.abs(x) * .18];
}
