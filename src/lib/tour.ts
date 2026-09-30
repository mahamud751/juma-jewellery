import { getPiece, type Piece } from "@/lib/catalog";

/**
 * The walk through the real shop, in the order a customer takes it:
 * Sylhet Plaza street front → ground floor → stairs → fourth-floor corridor → the Jhuma frontage →
 * inside → the necklace hall → the showroom wall. One photograph per step, /main/31.png to /main/38.png.
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
    photo: "/main/31.png",
    alt: "The front of Sylhet Plaza on Zindabazar road, with the Bangla Sylhet Plaza signs over the shop fronts.",
    hotspots: [{ x: 46, y: 80, label: "Go inside the plaza", go: "lobby" }],
  },
  {
    id: "lobby",
    name: "The ground floor",
    bengali: "মার্কেটের ভেতর",
    area: "outside",
    kicker: "Sylhet Plaza, ground floor",
    line: "Past the fashion and cosmetics shops, the main stairs go straight up the middle.",
    photo: "/main/32.png",
    alt: "The Sylhet Plaza ground floor with the main staircase between two shops.",
    hotspots: [{ x: 48, y: 64, label: "Take the main stairs", go: "stairs" }],
  },
  {
    id: "stairs",
    name: "The main stairs",
    bengali: "সিঁড়ি",
    area: "outside",
    kicker: "Sylhet Plaza, going up",
    line: "Up the lit stairs, past the other jewellers, to the fourth floor.",
    photo: "/main/33.png",
    alt: "A wide lit staircase in Sylhet Plaza with jewellery shops on the landing above.",
    hotspots: [{ x: 40, y: 38, label: "Up to the fourth floor", go: "corridor" }],
  },
  {
    id: "corridor",
    name: "The fourth floor",
    bengali: "চারতলা",
    area: "outside",
    kicker: "Sylhet Plaza, fourth floor",
    line: "Walk along the jewellers' corridor. The red Jhuma sign is at the far end.",
    photo: "/main/34.png",
    alt: "The fourth-floor corridor of Sylhet Plaza lined with jewellery shop signs, the Jhuma sign at the end.",
    hotspots: [{ x: 47, y: 44, label: "Walk to Jhuma Jewellers", go: "frontage" }],
  },
  {
    id: "frontage",
    name: "Jhuma Jewellers",
    bengali: "ঝুমা জুয়েলার্স",
    area: "outside",
    kicker: "Fourth floor, Sylhet Plaza",
    line: "The yellow sign. Through the glass doors you can already see the necklace busts.",
    photo: "/main/35.png",
    alt: "The Jhuma Jewellers shopfront with its yellow Bangla sign and glass doors.",
    hotspots: [{ x: 16, y: 58, label: "Step inside the shop", go: "inside" }],
  },
  {
    id: "inside",
    name: "Inside the shop",
    bengali: "দোকানের ভেতর",
    area: "shop",
    kicker: "Look around",
    line: "The Jhuma mark, with necklace sets in the lit cases on either side.",
    photo: "/main/36.png",
    alt: "The illuminated JHUMA Jewellers logo on a wooden wall between honeycomb cases of gold necklace sets.",
    hotspots: [{ x: 72, y: 84, label: "Into the showroom", go: "hall" }],
  },
  {
    id: "hall",
    name: "The necklace hall",
    bengali: "গহনার দেয়াল",
    area: "shop",
    kicker: "Showroom",
    line: "Necklace sets under the carved arch, chains on the shelves either side, and the counters below.",
    photo: "/main/37.png",
    alt: "A carved gold arch of necklace sets on blue velvet, shelves of chains on both sides and glass counters in front.",
    hotspots: [
      { x: 84, y: 50, label: "On to the showroom wall", go: "visit" },
      { x: 50, y: 13, label: "Today's gold rate", note: "The gold rate board in the shop is updated every day. Ask us for today's rate per bhori." },
    ],
  },
  {
    id: "visit",
    name: "The showroom wall",
    bengali: "আসুন, দেখে যান",
    area: "shop",
    kicker: "Come and see it",
    line: "Necklace sets in every alcove, with bangles, rings and earrings in the counter below. Sylhet Plaza, fourth floor, Zindabazar: every piece can be tried on in the shop.",
    photo: "/main/38.png",
    alt: "A wooden wall of lit alcoves holding gold necklace sets on blue busts, above a long glass counter.",
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
  { id: "hall", label: "Necklace hall", d: "M38 6h24v10H38z" },
  { id: "visit", label: "Showroom wall", d: "M82 10h10v26H82z" },
  { id: "inside", label: "Logo wall", d: "M8 44h6v18H8z" },
];
