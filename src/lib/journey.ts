/**
 * The scroll walk: Sylhet Plaza → inside the mall → the fourth floor → the Jhuma doors → the salon → five creations
 * shown one at a time → the private viewing. Progress is measured in stops (0 … LAST_STOP); one stop
 * is JOURNEY_STEP screen heights of scrolling.
 */

export const JOURNEY_STEP = 1.25;

/** The six approved photographs. 32 and 33 are deliberately not used. */
export const photoUrl = (id: number) => `/main/web/${id}.jpg`;
export const depthUrl = (id: number) => `/main/depth/${id}.png`;

export type Stop = {
  label: string;
  kicker: string;
  title: string;
  line: string;
  photo: number;
  piece?: number;
};

export const STOPS: Stop[] = [
  { label: "Sylhet Plaza", kicker: "Zindabazar · Sylhet", title: "A world of gold,\nfour floors up.", line: "Scroll to walk into Sylhet Plaza. Jhuma is waiting at the top.", photo: 31 },
  { label: "Inside the plaza", kicker: "Sylhet Plaza · Inside the mall", title: "Step inside.\nFollow the light.", line: "Walk past the shopfronts. Take a look around before continuing upstairs.", photo: 31 },
  { label: "Fourth floor", kicker: "Sylhet Plaza · Fourth floor", title: "Follow the light.", line: "The jewellers' floor. Jhuma is at the end, by the windows.", photo: 34 },
  { label: "The doors", kicker: "Jhuma Jewellers", title: "Beyond these doors.", line: "Keep scrolling. The doors are opening for you.", photo: 35 },
  { label: "The salon", kicker: "The Jhuma salon", title: "Welcome to Jhuma.", line: "Gold on royal blue velvet, framed in carved wood and warm light.", photo: 36 },
  { label: "Chain gallery", kicker: "The chain gallery", title: "Every chain,\nunder the golden arch.", line: "Rope, box and floral chains, with the pendants at the centre.", photo: 37 },
  { label: "Floral chains", kicker: "Creation 01 · Chain gallery", title: "Floral Chains", line: "The chains as they hang on these boards: flower stations, rope and a fine trace, on royal blue.", photo: 37, piece: 0 },
  { label: "Necklace wall", kicker: "The necklace wall", title: "Gold, on royal blue.", line: "A different room. Bridal sets on velvet busts, each with its matching earrings.", photo: 38 },
  { label: "Floral har", kicker: "Creation 02 · The cases", title: "Floral Har", line: "The next room. Gold sets in the cases: a collar, a flower pendant, and the earrings beside them.", photo: 36, piece: 1 },
  { label: "Jhumka", kicker: "Creation 03 · Brought forward", title: "Bell Jhumka", line: "Into the gallery. The bell jhumka comes forward: round gold, beadwork, and a small drop.", photo: 37, piece: 2 },
  { label: "Fan pendant", kicker: "Creation 04 · The alcove", title: "Fan Pendant", line: "Through to the alcove. The fan pendant hangs on the bust, earrings beside it.", photo: 38, piece: 3 },
  { label: "Gold rings", kicker: "Creation 05 · The glass counter", title: "Gold Rings", line: "One room over. Signet rings and gold bands, each on its own blue cushion, in the glass.", photo: 37, piece: 4 },
  { label: "Private viewing", kicker: "Private viewing · Sylhet Plaza, 4th floor", title: "A seat is\nwaiting for you.", line: "Book a private viewing and we will have your pieces ready when you arrive.", photo: 36 },
];
export const LAST_STOP = STOPS.length - 1;

export const PIECES = [
  { name: "Floral Chains", bengali: "ফুলের চেইন", slug: "chain-boards", details: ["Yellow gold", "The chain boards", "Jhuma, Sylhet"] },
  { name: "Floral Har", bengali: "ফ্লোরাল হার", slug: "floral-har", details: ["Yellow gold", "Necklace and earrings", "In the cases"] },
  { name: "Bell Jhumka", bengali: "ঝুমকা", slug: "floral-har", details: ["Yellow gold", "Bell, bead and drop", "Brought forward"] },
  { name: "Fan Pendant", bengali: "পাখা লকেট", slug: "fan-pendant", details: ["Yellow gold", "Fringed haar", "Matching earrings"] },
  { name: "Gold Rings", bengali: "সোনার আংটি", slug: "ring-counter-near", details: ["Yellow gold", "Signet and band", "The glass counter"] },
] as const;
/** The stop each creation is shown at. */
export const PIECE_STOPS = STOPS.flatMap((stop, index) => (stop.piece === undefined ? [] : [index]));
/** Pieces sharp enough to lift off the room. The others stay in the photograph. */
export const FLOATING_PIECES = new Set<number>([2]);

/**
 * How the camera moves inside each photograph. Every key names two pixels of the photo, as fractions
 * from the left and the top: `go` is where you walk (with `f`, the fraction of the way to it) and `look`
 * is what you look at. `dim` darkens the photo behind a creation.
 * `near`/`far` turn the relative depth map into distances, in metres-ish units.
 */
export type ShotKey = { at: number; go: [number, number]; f: number; look: [number, number]; dim?: number };
export type Shot = { photo: number; near: number; far: number; from: number; to: number; keys: ShotKey[] };

const PHOTO_SHOTS: Shot[] = [
  {
    photo: 31, near: 9, far: 24, from: -1, to: .82,
    keys: [
      { at: 0, go: [.455, .74], f: 0, look: [.5, .5] },
      { at: .2, go: [.455, .74], f: .07, look: [.49, .53] },
      { at: .82, go: [.455, .76], f: .62, look: [.455, .74] },
    ],
  },
  {
    photo: 34, near: 2.4, far: 24, from: .6, to: 1.78,
    keys: [
      { at: .6, go: [.48, .42], f: 0, look: [.5, .46] },
      { at: 1, go: [.48, .42], f: .09, look: [.47, .44] },
      { at: 1.15, go: [.48, .42], f: .13, look: [.47, .43] },
      { at: 1.78, go: [.47, .42], f: .74, look: [.47, .4] },
    ],
  },
  {
    photo: 35, near: 2.4, far: 18, from: 1.56, to: 2.02,
    keys: [
      { at: 1.56, go: [.18, .56], f: 0, look: [.5, .48] },
      { at: 1.72, go: [.18, .56], f: .12, look: [.3, .5] },
      { at: 2.02, go: [.17, .56], f: .62, look: [.17, .55] },
    ],
  },
  {
    photo: 36, near: 1.9, far: 8, from: 1.85, to: 3.72,
    keys: [
      { at: 1.85, go: [.5, .47], f: 0, look: [.5, .47] },
      { at: 2.75, go: [.5, .47], f: .02, look: [.5, .48] },
      { at: 3, go: [.5, .47], f: .1, look: [.5, .47] },
      { at: 3.72, go: [.5, .45], f: .5, look: [.5, .45] },
    ],
  },
  {
    // Chain gallery, then the boards. The chains themselves are the piece.
    photo: 37, near: 2, far: 7.5, from: 3.5, to: 5.58,
    keys: [
      { at: 3.5, go: [.5, .45], f: 0, look: [.5, .48] },
      { at: 4, go: [.5, .42], f: .16, look: [.5, .4] },
      { at: 4.5, go: [.64, .42], f: .12, look: [.7, .38] },
      { at: 5, go: [.63, .42], f: .11, look: [.64, .4], dim: .1 },
    ],
  },
  {
    // Necklace wall. The hole between rooms opens after the chains have settled.
    photo: 38, near: 2, far: 7.5, from: 5.22, to: 6.58,
    keys: [
      { at: 5.22, go: [.5, .48], f: 0, look: [.5, .46] },
      { at: 6, go: [.46, .44], f: .12, look: [.4, .4], dim: .1 },
    ],
  },
  {
    // Floral har: the case room, entered from the necklace wall. The busts are the piece.
    photo: 36, near: 1.9, far: 8, from: 6.22, to: 7.58,
    keys: [
      { at: 6.22, go: [.22, .48], f: 0, look: [.16, .46] },
      { at: 7, go: [.14, .48], f: .22, look: [.1, .42], dim: .12 },
    ],
  },
  {
    // Bell jhumka, the one sharp cut-out, brought forward in the gallery.
    photo: 37, near: 2, far: 7.5, from: 7.22, to: 8.58,
    keys: [
      { at: 7.22, go: [.5, .46], f: 0, look: [.5, .44], dim: .25 },
      { at: 8, go: [.5, .44], f: .12, look: [.5, .4], dim: .76 },
    ],
  },
  {
    // Fan pendant: the alcove in the necklace room. The bust is the piece.
    photo: 38, near: 2, far: 7.5, from: 8.22, to: 9.58,
    keys: [
      { at: 8.22, go: [.58, .46], f: 0, look: [.56, .44] },
      { at: 9, go: [.6, .44], f: .1, look: [.62, .4], dim: .08 },
    ],
  },
  {
    // Gold rings: the glass in the chain room. Stay back so the counter stays whole.
    photo: 37, near: 2, far: 7.5, from: 9.22, to: 10.58,
    keys: [
      { at: 9.22, go: [.5, .6], f: 0, look: [.5, .66] },
      { at: 10, go: [.5, .74], f: .16, look: [.5, .82], dim: .2 },
    ],
  },
  {
    // Private viewing. The logo and the chairs, after the counter.
    photo: 36, near: 1.9, far: 8, from: 10.22, to: 12,
    keys: [
      { at: 10.22, go: [.46, .44], f: 0, look: [.44, .42] },
      { at: 11, go: [.32, .58], f: .22, look: [.28, .5], dim: .1 },
      { at: 12, go: [.26, .66], f: .3, look: [.22, .56], dim: .08 },
    ],
  },
];

/** The 3D doors take over between the entrance photo and the salon. */
export const MALL = { enter: .48, inside: .84, stop: 1, exit: 1.6, gone: 1.96 } as const;
export const DOOR_STOP = 3;

// One full stop of modeled architecture sits between the first and second photos.
// All later photo, door and creation timings keep their original spacing.
export const SHOTS: Shot[] = PHOTO_SHOTS.map((shot, index) => index === 0 ? shot : ({
  ...shot, from: shot.from + 1, to: shot.to + 1,
  keys: shot.keys.map((key) => ({ ...key, at: key.at + 1 })),
}));
export const DOORS = { appear: [2.8, 2.97], open: [3.12, 3.62], walk: [3.05, 3.78], gone: 3.8 } as const;

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const smooth = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
