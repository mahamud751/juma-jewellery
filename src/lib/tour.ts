import { getPiece, type Piece } from "@/lib/catalog";

/**
 * The walk through the real shop, in the order a customer takes it:
 * Sylhet Plaza street front → corridor → the Jhuma frontage → inside → each display.
 *
 * Photo hotspots are percentages of the 4:3 photograph (x from the left, y from the top).
 * When the shop sends 360° photos, set `pano` to an equirectangular image and give each
 * hotspot a `yaw`/`pitch` (degrees; yaw 0 is the centre of the panorama, positive is right,
 * positive pitch is up). The scene then opens as a drag-to-look-around view.
 */
export type Hotspot = {
  x: number;
  y: number;
  yaw?: number;
  pitch?: number;
  label: string;
} & ({ piece: string } | { go: string; /** A film played while walking to the next scene. */ walk?: string } | { note: string });

export type Scene = {
  id: string;
  name: string;
  bengali: string;
  area: "outside" | "shop";
  kicker: string;
  line: string;
  photo: string;
  /** A film of this spot, offered as "Watch the film". */
  film?: string;
  pano?: string;
  alt: string;
  hotspots: Hotspot[];
};

export const SCENES: Scene[] = [
  {
    id: "street",
    name: "Sylhet Plaza",
    bengali: "সিলেট প্লাজা",
    area: "outside",
    kicker: "Zindabazar, Sylhet",
    line: "The market front on Zindabazar road. Jhuma is inside, on the fourth floor.",
    photo: "/media/full/IMG_7098.jpg",
    film: "/media/films/IMG_7102.mp4",
    alt: "The front of Sylhet Plaza market on Zindabazar road, with motorbikes parked outside.",
    hotspots: [{ x: 30, y: 67, label: "Go inside the plaza", go: "corridor", walk: "/media/films/IMG_7099.mp4" }],
  },
  {
    id: "corridor",
    name: "The corridor",
    bengali: "মার্কেটের ভেতর",
    area: "outside",
    kicker: "Sylhet Plaza, ground floor",
    line: "Take the main stairs up to the fourth floor.",
    photo: "/media/full/IMG_7100.jpg",
    film: "/media/films/IMG_7099.mp4",
    alt: "The Sylhet Plaza corridor with the main staircase in the middle.",
    hotspots: [{ x: 47, y: 64, label: "Up to the fourth floor", go: "frontage", walk: "/media/films/IMG_7109.mp4" }],
  },
  {
    id: "frontage",
    name: "Jhuma Jewellers",
    bengali: "ঝুমা জুয়েলার্স",
    area: "outside",
    kicker: "Fourth floor, Sylhet Plaza",
    line: "The yellow sign. Through the glass you can already see the necklace arch.",
    photo: "/media/full/IMG_7105.jpg",
    alt: "The Jhuma Jewellers shopfront with its yellow Bangla sign and glass doors.",
    hotspots: [{ x: 45, y: 62, label: "Step inside the shop", go: "inside", walk: "/media/films/IMG_7104.mp4" }],
  },
  {
    id: "inside",
    name: "Inside the shop",
    bengali: "দোকানের ভেতর",
    area: "shop",
    kicker: "Look around",
    line: "Tap any display to walk up to it: the necklace arch, the chain wall, the ring and earring counters.",
    photo: "/media/full/IMG_7141.jpg",
    film: "/media/films/IMG_7139.mp4",
    alt: "Inside Jhuma Jewellers: a carved arch of necklace sets, shelves of chains, glass counters and the JHUMA logo.",
    hotspots: [
      { x: 44, y: 44, label: "Necklace sets", go: "sets" },
      { x: 28, y: 42, label: "Chains & bracelets", go: "chains" },
      { x: 86, y: 40, label: "More sets", go: "sets-close" },
      { x: 40, y: 61, label: "Ring counter", go: "rings" },
      { x: 72, y: 71, label: "Earring counter", go: "earrings" },
      { x: 7, y: 42, label: "The Jhuma mark", go: "visit" },
      { x: 81, y: 27, label: "Today's gold rate", note: "The gold rate board in the shop is updated every day. Ask us for today's rate per bhori." },
    ],
  },
  {
    id: "sets",
    name: "The necklace arch",
    bengali: "নেকলেস সেট",
    area: "shop",
    kicker: "Back wall",
    line: "Necklace sets with matching earrings, on blue velvet under the carved arch.",
    photo: "/media/full/IMG_7118.jpg",
    film: "/media/films/IMG_7115.mp4",
    alt: "Gold necklace sets on blue velvet busts inside the carved arch at Jhuma Jewellers.",
    hotspots: [
      { x: 52, y: 29, label: "Fan pendant set", piece: "fan-pendant" },
      { x: 29, y: 38, label: "Long chain set", piece: "layered-chain" },
      { x: 66, y: 42, label: "Short necklace set", piece: "under-the-arch" },
      { x: 51, y: 77, label: "Bib necklace", piece: "three-sets" },
      { x: 38, y: 74, label: "Matching earrings", piece: "earring-busts" },
      { x: 92, y: 40, label: "Closer to the sets", go: "sets-close" },
    ],
  },
  {
    id: "sets-close",
    name: "Sets, up close",
    bengali: "কাছ থেকে",
    area: "shop",
    kicker: "Beside the arch",
    line: "Three sets side by side: a heart pendant, a flower drop, and a tassel chain.",
    photo: "/media/full/IMG_7121.jpg",
    film: "/media/films/IMG_7116.mp4",
    alt: "Three gold necklace sets on blue velvet, with heart, flower and tassel pendants.",
    hotspots: [
      { x: 14, y: 51, label: "Heart pendant", piece: "heart-pendant" },
      { x: 39, y: 55, label: "Lotus cascade", piece: "lotus-cascade" },
      { x: 67, y: 64, label: "Tassel chain", piece: "floral-har" },
      { x: 50, y: 76, label: "Jhumka earrings", piece: "earring-busts" },
    ],
  },
  {
    id: "chains",
    name: "The chain wall",
    bengali: "চেইন ও ব্রেসলেট",
    area: "shop",
    kicker: "Left wall",
    line: "Flower bracelets on the left board, rope and box chains on the right.",
    photo: "/media/full/IMG_7120.jpg",
    film: "/media/films/IMG_7112.mp4",
    alt: "Two blue velvet boards hung with gold bracelets and chains.",
    hotspots: [
      { x: 32, y: 48, label: "Flower bracelets", piece: "chain-boards" },
      { x: 64, y: 42, label: "Rope & box chains", piece: "chains-across" },
      { x: 45, y: 40, label: "Leaf bracelet", piece: "chains-return" },
    ],
  },
  {
    id: "rings",
    name: "The ring counter",
    bengali: "আংটি",
    area: "shop",
    kicker: "Front counter",
    line: "Gold rings and signets, one to a velvet box. Every piece is weighed in front of you.",
    photo: "/media/full/IMG_7134.jpg",
    film: "/media/films/IMG_7132.mp4",
    alt: "Rows of gold rings in blue velvet boxes under the glass counter.",
    hotspots: [
      { x: 67, y: 45, label: "Signet rings", piece: "ring-counter" },
      { x: 39, y: 46, label: "Ladies' rings", piece: "ring-counter-near" },
      { x: 83, y: 31, label: "The full counter", piece: "ring-counter-wide" },
    ],
  },
  {
    id: "earrings",
    name: "The earring counter",
    bengali: "কানের দুল",
    area: "shop",
    kicker: "Side counter",
    line: "Drops, studs and jhumka, tray after tray.",
    photo: "/media/full/IMG_7130.jpg",
    film: "/media/films/IMG_7128.mp4",
    alt: "Trays of gold earrings on blue velvet under the glass counter.",
    hotspots: [
      { x: 55, y: 50, label: "Drop earrings", piece: "earring-trays" },
      { x: 76, y: 50, label: "Studs", piece: "earring-trays-near" },
      { x: 25, y: 44, label: "Long drops", piece: "earring-trays-pass" },
    ],
  },
  {
    id: "visit",
    name: "Come and see it",
    bengali: "আসুন, দেখে যান",
    area: "shop",
    kicker: "Jhuma Jewellers",
    line: "Sylhet Plaza, fourth floor, Zindabazar. Every piece here can be tried on in the shop.",
    photo: "/media/full/IMG_7143.jpg",
    film: "/media/films/IMG_7142.mp4",
    alt: "The illuminated JHUMA Jewellers logo on the carved wooden wall.",
    hotspots: [],
  },
];

/** Fill in the shop's WhatsApp number (country code, digits only, e.g. "8801XXXXXXXXX") to show "Ask price on WhatsApp". */
export const CONTACT = {
  whatsapp: "",
  maps: "https://www.google.com/maps/search/?api=1&query=Jhuma+Jewellers+Sylhet+Plaza+Zindabazar+Sylhet",
};

export const sceneIndex = (id: string) => SCENES.findIndex((scene) => scene.id === id);

export const hotspotPiece = (spot: Hotspot): Piece | undefined => ("piece" in spot ? getPiece(spot.piece) : undefined);

/** Floor plan of the one room, drawn from the photographs. Viewbox 100 × 80, door at the bottom. */
export const PLAN_ZONES: { id: string; label: string; d: string }[] = [
  { id: "sets", label: "Necklace arch", d: "M38 6h24v10H38z" },
  { id: "chains", label: "Chain wall", d: "M8 10h10v26H8z" },
  { id: "sets-close", label: "Sets", d: "M82 10h10v26H82z" },
  { id: "rings", label: "Ring counter", d: "M26 30h38v8H26z" },
  { id: "earrings", label: "Earring counter", d: "M70 40h8v26h-8z" },
  { id: "visit", label: "Logo wall", d: "M8 44h6v18H8z" },
];
