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
  { label: "Mango pendant", kicker: "Creation 01 · Chain gallery", title: "Mango Pendant Chain", line: "A paisley pendant in raised filigree, with a ruby at its heart and a fringe of gold drops.", photo: 37, piece: 0 },
  { label: "Necklace wall", kicker: "The necklace wall", title: "Gold, on royal blue.", line: "Bridal sets on velvet busts, each with its matching earrings.", photo: 38 },
  { label: "Rani haar", kicker: "Creation 02 · Necklace wall", title: "Rani Haar", line: "A bridal collar of hand-set flowers, a layered bead strand and a ruby drop pendant.", photo: 38, piece: 1 },
  { label: "Jhumka", kicker: "Creation 03 · Necklace wall", title: "Bell Jhumka", line: "Domed gold bells fringed with beads. They move when you do.", photo: 38, piece: 2 },
  { label: "Churi", kicker: "Creation 04 · The counter", title: "Bridal Churi", line: "A stack of three: two beaded bands around a twisted rope kada.", photo: 38, piece: 3 },
  { label: "Flower ring", kicker: "Creation 05 · The counter", title: "Flower Ring", line: "Eight petals of raised filigree, crowned with a ruby.", photo: 38, piece: 4 },
  { label: "Private viewing", kicker: "Private viewing · Sylhet Plaza, 4th floor", title: "A seat is\nwaiting for you.", line: "Book a private viewing and we will have your pieces ready when you arrive.", photo: 36 },
];
export const LAST_STOP = STOPS.length - 1;

export const PIECES = [
  { name: "Mango Pendant Chain", bengali: "আম লকেট চেইন", details: ["Gold", "Filigree", "Ruby"] },
  { name: "Rani Haar", bengali: "রানী হার", details: ["Gold", "Bridal set", "Ruby drop"] },
  { name: "Bell Jhumka", bengali: "ঝুমকা", details: ["Gold", "Pair", "Bead fringe"] },
  { name: "Bridal Churi", bengali: "চুড়ি", details: ["Gold", "Set of three", "Rope kada"] },
  { name: "Flower Ring", bengali: "ফুল আংটি", details: ["Gold", "Filigree", "Ruby"] },
] as const;
/** The stop each creation is shown at. */
export const PIECE_STOPS = STOPS.flatMap((stop, index) => (stop.piece === undefined ? [] : [index]));

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
    photo: 37, near: 2, far: 7.5, from: 3.5, to: 5.74,
    keys: [
      { at: 3.5, go: [.5, .45], f: 0, look: [.5, .48] },
      { at: 4, go: [.5, .42], f: .14, look: [.5, .45] },
      { at: 4.25, go: [.5, .42], f: .18, look: [.5, .44] },
      { at: 4.72, go: [.5, .38], f: .48, look: [.5, .38], dim: .78 },
      { at: 5.25, go: [.5, .38], f: .52, look: [.5, .38], dim: .78 },
      { at: 5.74, go: [.5, .4], f: .66, look: [.5, .4], dim: .5 },
    ],
  },
  {
    photo: 38, near: 2, far: 7.5, from: 5.52, to: 10.62,
    keys: [
      { at: 5.52, go: [.5, .47], f: 0, look: [.5, .5] },
      { at: 6, go: [.5, .45], f: .12, look: [.5, .46] },
      { at: 6.25, go: [.5, .45], f: .15, look: [.5, .46] },
      { at: 6.72, go: [.51, .4], f: .46, look: [.51, .39], dim: .78 },
      { at: 7.25, go: [.51, .4], f: .48, look: [.51, .39], dim: .78 },
      { at: 8, go: [.6, .46], f: .44, look: [.6, .45], dim: .8 },
      { at: 9, go: [.26, .55], f: .3, look: [.24, .58], dim: .82 },
      { at: 10, go: [.66, .55], f: .3, look: [.68, .58], dim: .82 },
      { at: 10.62, go: [.5, .6], f: .55, look: [.5, .6], dim: .6 },
    ],
  },
  {
    photo: 36, near: 1.9, far: 8, from: 10.4, to: 12,
    keys: [
      { at: 10.4, go: [.5, .5], f: 0, look: [.5, .47], dim: .3 },
      { at: 10.85, go: [.4, .7], f: .06, look: [.46, .5], dim: .35 },
      { at: 11, go: [.4, .7], f: .1, look: [.44, .52], dim: .35 },
      { at: 12, go: [.4, .7], f: .16, look: [.42, .53], dim: .35 },
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
