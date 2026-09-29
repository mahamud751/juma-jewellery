export type Model =
  | "solitaire"
  | "halo"
  | "eternity"
  | "band"
  | "pendant"
  | "riviera"
  | "studs"
  | "drops"
  | "hoops"
  | "tennis"
  | "cuff"
  | "loose";

export type Category = "Sets" | "Chains" | "Rings" | "Earrings" | "Salon" | "Visit";
export type MetalId = "platinum" | "white-gold" | "yellow-gold" | "rose-gold";
export type StoneId = "white" | "violet" | "ice" | "champagne";
export type Kind = "photo" | "film";

export const METALS: Record<MetalId, { label: string; color: string }> = {
  platinum: { label: "Platinum 950", color: "#eceef4" },
  "white-gold": { label: "18k White Gold", color: "#e2e2e6" },
  "yellow-gold": { label: "Yellow gold", color: "#f0c677" },
  "rose-gold": { label: "18k Rose Gold", color: "#ebb39c" },
};

export const HOUSE = {
  name: "Jhuma Jewellers",
  bengali: "ঝুমা জুয়েলার্স",
  address: "Sylhet Plaza Market, 4th Floor, Zindabazar, Sylhet",
  short: "Zindabazar, Sylhet",
};

export type Piece = {
  slug: string;
  name: string;
  collection: string;
  category: Category;
  model: Model;
  stone: StoneId;
  metals: MetalId[];
  /** Gold is quoted in the salon, so nothing here carries a fixed price. */
  price: number | null;
  carat: string;
  line: string;
  story: string;
  specs: [string, string][];
  kind: Kind;
  alt: string;
  src: string;
  poster: string;
  card: string;
};

export type Collection = {
  slug: string;
  numeral: string;
  name: string;
  tagline: string;
  story: string;
  signature: string;
  accent: string;
};

type Draft = {
  slug: string;
  id: string;
  kind: Kind;
  name: string;
  collection: string;
  category: Category;
  line: string;
  story: string;
  alt: string;
};

const modelFor = (category: Category): Model => {
  if (category === "Rings") return "solitaire";
  if (category === "Earrings") return "drops";
  if (category === "Chains") return "tennis";
  if (category === "Salon") return "loose";
  return "pendant";
};

const piece = (draft: Draft): Piece => ({
  ...draft,
  model: modelFor(draft.category),
  stone: "champagne",
  metals: ["yellow-gold"],
  price: null,
  carat: draft.kind === "film" ? "Film" : "Still",
  src: draft.kind === "film" ? `/media/films/${draft.id}.mp4` : `/media/full/${draft.id}.jpg`,
  poster: `/media/full/${draft.id}.jpg`,
  card: `/media/card/${draft.id}.jpg`,
  specs: [
    ["Seen as", draft.kind === "film" ? "A film made in the salon" : "A photograph made in the salon"],
    ["Metal", "Yellow gold, as displayed"],
    ["House", HOUSE.address],
  ],
});

export const COLLECTIONS: Collection[] = [
  {
    slug: "sets",
    numeral: "I",
    name: "Sets",
    tagline: "A necklace and its earrings, composed as one.",
    story:
      "The carved alcove at the back of the salon holds matched sets: long chains, fan pendants, floral har pieces and the earrings made to sit with them. Every still and film here was taken on that wall.",
    signature: "floral-har",
    accent: "#e7c27a",
  },
  {
    slug: "chains",
    numeral: "II",
    name: "Chains",
    tagline: "Rope, box, floral and bead, hung by the length.",
    story:
      "Two blue boards carry the chains, row after row, from a fine trace up to a heavy rope. They are filmed the way a client sees them: walking the length of the counter.",
    signature: "chain-boards",
    accent: "#f0d48a",
  },
  {
    slug: "rings",
    numeral: "III",
    name: "Rings",
    tagline: "Signets and gold bands, one to a cushion.",
    story:
      "The ring counter is a field of small blue cushions. Each ring sits alone, so the face, the shoulders and the polish can be read before it is tried.",
    signature: "ring-counter",
    accent: "#d7b56a",
  },
  {
    slug: "earrings",
    numeral: "IV",
    name: "Earrings",
    tagline: "Jhumka, drops and studs across the blue trays.",
    story:
      "Some earrings are worn on the busts beside their necklace. The rest fill the glass trays: flower drops, jhumka, hoops and studs, pair by pair.",
    signature: "earring-trays",
    accent: "#c9d4f2",
  },
  {
    slug: "salon",
    numeral: "V",
    name: "The Salon",
    tagline: "Blue velvet, carved wood, and a chandelier.",
    story:
      "Jhuma is one room, lined in royal blue and gilt timber. A chandelier hangs over the counters, and the name is set in gold on the wall above the alcove.",
    signature: "chandelier-room",
    accent: "#9eb6e8",
  },
  {
    slug: "zindabazar",
    numeral: "VI",
    name: "Zindabazar",
    tagline: "Fourth floor, Sylhet Plaza.",
    story:
      "The salon looks onto the night market from a glass front on the fourth floor of Sylhet Plaza. These frames follow the street, the corridor, and the illuminated sign.",
    signature: "night-frontage",
    accent: "#f2c14e",
  },
];

const DRAFTS: Draft[] = [
  {
    slug: "floral-har",
    id: "IMG_7126",
    kind: "photo",
    name: "Floral Har",
    collection: "sets",
    category: "Sets",
    line: "A layered set with a flower pendant, on blue velvet.",
    story:
      "Three lengths of yellow gold fall over a velvet bust: a fine trace, a heavier curb, and a floral pendant with matching earrings. This is the set the alcove is built to show.",
    alt: "Yellow gold layered necklace with a floral pendant and matching earrings on a blue velvet bust at Jhuma Jewellers.",
  },
  {
    slug: "floral-har-side",
    id: "IMG_7127",
    kind: "photo",
    name: "Floral Har, Side",
    collection: "sets",
    category: "Sets",
    line: "The same set, turned so the chains separate.",
    story: "From the side the three chains part, and the flower pendant sits clear of the bust. The earrings stay in frame.",
    alt: "Side view of a layered yellow gold necklace and floral pendant on a blue velvet display.",
  },
  {
    slug: "floral-har-film",
    id: "IMG_7125",
    kind: "film",
    name: "Floral Har, In Motion",
    collection: "sets",
    category: "Sets",
    line: "A slow pass across the floral set.",
    story: "The camera moves along the chains so the flower pendant and the matching earrings catch the salon lights in turn.",
    alt: "Film of a yellow gold floral necklace set on a blue velvet bust.",
  },
  {
    slug: "lotus-cascade",
    id: "IMG_7121",
    kind: "photo",
    name: "Lotus Cascade",
    collection: "sets",
    category: "Sets",
    line: "A long chain, a lotus pendant, and a fan of stones.",
    story:
      "One bust wears a long chain ending in a lotus, with a wider jewelled fan beneath it and long earrings beside. The carved arch frames the set.",
    alt: "Ornate yellow gold necklace with a lotus pendant and cascading earrings on a display bust.",
  },
  {
    slug: "fan-pendant",
    id: "IMG_7122",
    kind: "photo",
    name: "Fan Pendant",
    collection: "sets",
    category: "Sets",
    line: "A fan-shaped pendant between two other sets.",
    story: "The centre bust carries a broad fan pendant on several chains, with floral earrings. Two neighbouring sets stay in the frame.",
    alt: "Three gold necklace sets on blue velvet busts, the centre one with a fan-shaped pendant.",
  },
  {
    slug: "alcove-sets",
    id: "IMG_7118",
    kind: "photo",
    name: "The Alcove",
    collection: "sets",
    category: "Sets",
    line: "The whole back wall, under the chandelier.",
    story:
      "A wide view of the set alcove: three busts in front, more gold in the niches behind, and the chandelier overhead. This is the room as a client meets it.",
    alt: "Wide view of gold necklace sets displayed in a carved blue and gilt alcove.",
  },
  {
    slug: "alcove-evening",
    id: "IMG_7119",
    kind: "photo",
    name: "Alcove, Evening",
    collection: "sets",
    category: "Sets",
    line: "The same wall, a step closer.",
    story: "Evening light on the alcove, with the front busts and the sets behind them held in one frame.",
    alt: "Evening photograph of the necklace alcove at Jhuma Jewellers.",
  },
  {
    slug: "under-the-arch",
    id: "IMG_7123",
    kind: "photo",
    name: "Under the Arch",
    collection: "sets",
    category: "Sets",
    line: "Three busts framed by carved gilt.",
    story: "A tighter frame on the three front busts, the carved arch cutting across the top of the picture.",
    alt: "Three gold necklace displays standing under a carved gilt arch.",
  },
  {
    slug: "between-the-columns",
    id: "IMG_7124",
    kind: "photo",
    name: "Between the Columns",
    collection: "sets",
    category: "Sets",
    line: "Sets standing between the gilt columns.",
    story: "The columns of the alcove hold the sets in a row, blue velvet against gold leaf.",
    alt: "Gold necklace sets arranged between gilt columns in a jewellery salon.",
  },
  {
    slug: "through-the-arch",
    id: "IMG_7110",
    kind: "film",
    name: "Through the Arch",
    collection: "sets",
    category: "Sets",
    line: "The camera finds the sets through carved wood.",
    story: "A film that moves through the arch onto the busts, the way the alcove reveals itself from the doorway.",
    alt: "Film moving through a carved wooden arch onto gold necklace sets.",
  },
  {
    slug: "three-sets",
    id: "IMG_7111",
    kind: "film",
    name: "Three Sets",
    collection: "sets",
    category: "Sets",
    line: "Three floral sets, one after another.",
    story: "The camera travels across three busts, each wearing a floral set with its own earrings.",
    alt: "Film passing three yellow gold floral necklace sets on blue velvet.",
  },
  {
    slug: "full-alcove",
    id: "IMG_7115",
    kind: "film",
    name: "The Full Alcove",
    collection: "sets",
    category: "Sets",
    line: "A sweep of the entire set wall.",
    story: "From one side of the alcove to the other: busts, niches, and the chandelier just in frame.",
    alt: "Film sweeping across the full necklace wall at Jhuma Jewellers.",
  },
  {
    slug: "heart-pendant",
    id: "IMG_7116",
    kind: "film",
    name: "Heart Pendant",
    collection: "sets",
    category: "Sets",
    line: "A close pass on a heart-shaped pendant.",
    story: "The lens stays with one pendant, a heart of yellow gold, long enough to read the work in it.",
    alt: "Close film of a yellow gold heart pendant necklace.",
  },
  {
    slug: "layered-chain",
    id: "IMG_7117",
    kind: "film",
    name: "Layered Chain",
    collection: "sets",
    category: "Sets",
    line: "Several chains worn together.",
    story: "A short film of a layered chain set, the links moving only as the camera moves.",
    alt: "Film of layered yellow gold chains on a display bust.",
  },
  {
    slug: "chain-boards",
    id: "IMG_7120",
    kind: "photo",
    name: "The Chain Boards",
    collection: "chains",
    category: "Chains",
    line: "Dozens of chains, two boards, one counter.",
    story:
      "Rope, box, floral and bead chains hang in rows on royal blue. A client reads them from the fine rows at the top to the heavier ropes below.",
    alt: "Two blue display boards covered with rows of yellow gold chains in a jewellery shop.",
  },
  {
    slug: "chains-across",
    id: "IMG_7112",
    kind: "film",
    name: "Chains, Across",
    collection: "chains",
    category: "Chains",
    line: "Walking the length of the chain boards.",
    story: "The camera travels left to right so each row of chains catches the light in sequence.",
    alt: "Film travelling across boards of hanging gold chains.",
  },
  {
    slug: "chains-return",
    id: "IMG_7113",
    kind: "film",
    name: "Chains, Return",
    collection: "chains",
    category: "Chains",
    line: "Back along the same boards.",
    story: "A second pass, returning across the chains, closer to the heavier ropes.",
    alt: "Film returning along a display of yellow gold chains.",
  },
  {
    slug: "ring-counter",
    id: "IMG_7134",
    kind: "photo",
    name: "The Ring Counter",
    collection: "rings",
    category: "Rings",
    line: "A field of gold rings on blue cushions.",
    story:
      "Signets, bands and raised faces, each on its own cushion. The counter is arranged so a ring can be chosen without lifting the one beside it.",
    alt: "Many yellow gold rings displayed on individual blue cushions.",
  },
  {
    slug: "ring-counter-near",
    id: "IMG_7135",
    kind: "photo",
    name: "Rings, Closer",
    collection: "rings",
    category: "Rings",
    line: "The same counter, close enough to read the faces.",
    story: "A nearer still of the ring counter. The cushions, the polish and the different faces are easier to tell apart.",
    alt: "Close photograph of gold rings on blue velvet cushions.",
  },
  {
    slug: "ring-counter-wide",
    id: "IMG_7136",
    kind: "photo",
    name: "Rings, Wide",
    collection: "rings",
    category: "Rings",
    line: "The full run of the ring counter.",
    story: "A wider frame of the rings, showing how the counter is laid out from the near edge to the glass.",
    alt: "Wide photograph of a jewellery counter filled with gold rings.",
  },
  {
    slug: "rings-in-motion",
    id: "IMG_7132",
    kind: "film",
    name: "Rings, In Motion",
    collection: "rings",
    category: "Rings",
    line: "A slow drift over the cushions.",
    story: "The camera drifts across the ring counter so the faces turn in the light.",
    alt: "Film drifting over gold rings on blue cushions.",
  },
  {
    slug: "rings-pass",
    id: "IMG_7133",
    kind: "film",
    name: "Rings, A Pass",
    collection: "rings",
    category: "Rings",
    line: "One more pass along the counter.",
    story: "A second film of the rings, taken from a slightly different height.",
    alt: "Second film passing along a display of gold rings.",
  },
  {
    slug: "earring-trays",
    id: "IMG_7130",
    kind: "photo",
    name: "The Earring Trays",
    collection: "earrings",
    category: "Earrings",
    line: "Pairs laid out on royal blue.",
    story:
      "Flower drops, jhumka, hoops and studs, arranged in rows on a blue tray. Each pair is spaced so it can be lifted on its own.",
    alt: "Trays of yellow gold earrings arranged in rows on blue velvet.",
  },
  {
    slug: "earring-trays-near",
    id: "IMG_7131",
    kind: "photo",
    name: "Earrings, Closer",
    collection: "earrings",
    category: "Earrings",
    line: "The trays, near enough to compare pairs.",
    story: "A closer still of the earring trays, where the difference between a drop and a jhumka is easy to see.",
    alt: "Close photograph of gold earrings in rows on a blue display tray.",
  },
  {
    slug: "earring-busts",
    id: "IMG_7114",
    kind: "film",
    name: "Earrings on the Busts",
    collection: "earrings",
    category: "Earrings",
    line: "Flower drops and jhumka, worn with their sets.",
    story: "A film along the busts, made to show the earrings that belong to each necklace rather than the trays.",
    alt: "Film of gold earrings displayed on velvet busts beside necklace sets.",
  },
  {
    slug: "earring-trays-film",
    id: "IMG_7128",
    kind: "film",
    name: "Across the Trays",
    collection: "earrings",
    category: "Earrings",
    line: "Moving over the earring trays.",
    story: "The camera crosses the trays so the rows of pairs pass in order.",
    alt: "Film moving across trays of gold earrings.",
  },
  {
    slug: "earring-trays-pass",
    id: "IMG_7129",
    kind: "film",
    name: "The Trays, Again",
    collection: "earrings",
    category: "Earrings",
    line: "A second pass, lower and slower.",
    story: "Another film of the same trays, held lower so the nearer pairs fill the frame.",
    alt: "Close film of gold earrings on blue trays.",
  },
  {
    slug: "chandelier-room",
    id: "IMG_7141",
    kind: "photo",
    name: "Under the Chandelier",
    collection: "salon",
    category: "Salon",
    line: "The room, from the glass inward.",
    story:
      "Blue walls, gilt carving, the chandelier, and the Jhuma mark above the alcove. This is the salon as it looks when you step through the door.",
    alt: "Interior of Jhuma Jewellers with a chandelier, blue walls and gold displays.",
  },
  {
    slug: "through-the-glass",
    id: "IMG_7140",
    kind: "photo",
    name: "Through the Glass",
    collection: "salon",
    category: "Salon",
    line: "Looking into the salon from the corridor.",
    story: "The interior seen through the front glass: counters, busts, and the warm light against the night outside.",
    alt: "View through glass into the Jhuma Jewellers showroom at night.",
  },
  {
    slug: "salon-turn",
    id: "IMG_7139",
    kind: "film",
    name: "A Turn Through the Salon",
    collection: "salon",
    category: "Salon",
    line: "One continuous turn of the room.",
    story: "A film that turns through the salon, past the counters and the people who keep it, and back to the gold.",
    alt: "Film turning through the interior of Jhuma Jewellers.",
  },
  {
    slug: "from-the-doorway",
    id: "IMG_7104",
    kind: "film",
    name: "From the Doorway",
    collection: "salon",
    category: "Salon",
    line: "The first look in, before you enter.",
    story: "Shot from the threshold. The blue room and the gold open up as the door is passed.",
    alt: "Film looking from the doorway into the jewellery salon.",
  },
  {
    slug: "the-mark",
    id: "IMG_7143",
    kind: "photo",
    name: "The Mark",
    collection: "salon",
    category: "Salon",
    line: "The gold monogram, lit on the wall.",
    story: "A round illuminated mark: the letters J and H, and the name Jhuma Jewellers beneath them, set in gold on the salon wall.",
    alt: "Illuminated circular gold sign reading Jhuma Jewellers inside the salon.",
  },
  {
    slug: "the-mark-side",
    id: "IMG_7144",
    kind: "photo",
    name: "The Mark, Aside",
    collection: "salon",
    category: "Salon",
    line: "The same mark, from the side.",
    story: "A second still of the monogram, taken from an angle so the gold letters sit against the warm wall.",
    alt: "Angled photograph of the circular Jhuma Jewellers monogram.",
  },
  {
    slug: "the-mark-film",
    id: "IMG_7142",
    kind: "film",
    name: "The Mark, Alight",
    collection: "salon",
    category: "Salon",
    line: "The monogram, filmed in the room.",
    story: "A short film of the illuminated mark, with the salon moving slightly at the edges of the frame.",
    alt: "Film of the illuminated Jhuma Jewellers monogram inside the salon.",
  },
  {
    slug: "night-frontage",
    id: "IMG_7105",
    kind: "photo",
    name: "The Frontage at Night",
    collection: "zindabazar",
    category: "Visit",
    line: "Blue neon, gold letters, and the sets in the window.",
    story:
      "The glass front of Jhuma on the fourth floor of Sylhet Plaza. The name is lit, and the necklace sets are already visible from the corridor.",
    alt: "Night photograph of the Jhuma Jewellers storefront with blue neon and gold lettering.",
  },
  {
    slug: "frontage-open",
    id: "IMG_7106",
    kind: "photo",
    name: "The Frontage, Open",
    collection: "zindabazar",
    category: "Visit",
    line: "The salon with the door open to the corridor.",
    story: "A still of the frontage while the salon is open, the interior light meeting the corridor.",
    alt: "Jhuma Jewellers storefront at night with the entrance open.",
  },
  {
    slug: "frontage-sign",
    id: "IMG_7107",
    kind: "photo",
    name: "The Sign",
    collection: "zindabazar",
    category: "Visit",
    line: "The name, large enough to read from the corridor.",
    story: "A frame made for the sign itself: Jhuma Jewellers, and the floor of Sylhet Plaza beneath it.",
    alt: "Close night photograph of the Jhuma Jewellers storefront sign.",
  },
  {
    slug: "frontage-wide",
    id: "IMG_7108",
    kind: "photo",
    name: "The Frontage, Wide",
    collection: "zindabazar",
    category: "Visit",
    line: "The whole glass front, and the market beside it.",
    story: "A wider still so the salon sits in the corridor of Sylhet Plaza, not on its own.",
    alt: "Wide night view of the Jhuma Jewellers glass front in Sylhet Plaza.",
  },
  {
    slug: "frontage-film",
    id: "IMG_7109",
    kind: "film",
    name: "The Illuminated Front",
    collection: "zindabazar",
    category: "Visit",
    line: "The frontage, filmed along the glass.",
    story: "A film that travels the length of the glass front, from the sign to the sets in the window.",
    alt: "Film of the illuminated Jhuma Jewellers storefront at night.",
  },
  {
    slug: "frontage-close",
    id: "IMG_7103",
    kind: "film",
    name: "Gold Light",
    collection: "zindabazar",
    category: "Visit",
    line: "Closer on the sign and the window.",
    story: "A nearer film of the frontage, where the gold letters and the blue neon fill the frame.",
    alt: "Close film of the Jhuma Jewellers sign glowing at night.",
  },
  {
    slug: "plaza-street",
    id: "IMG_7097",
    kind: "photo",
    name: "Sylhet Plaza",
    collection: "zindabazar",
    category: "Visit",
    line: "The building, from the street at night.",
    story: "Sylhet Plaza from street level. Jhuma is on the fourth floor, above the lit shopfronts.",
    alt: "Night street photograph of Sylhet Plaza in Zindabazar.",
  },
  {
    slug: "plaza-front",
    id: "IMG_7098",
    kind: "photo",
    name: "The Plaza Front",
    collection: "zindabazar",
    category: "Visit",
    line: "A wider view of the same street.",
    story: "The plaza frontage and the traffic of Zindabazar, the way the building is found.",
    alt: "Wider night photograph of the street in front of Sylhet Plaza.",
  },
  {
    slug: "arriving",
    id: "IMG_7096",
    kind: "film",
    name: "Arriving",
    collection: "zindabazar",
    category: "Visit",
    line: "The street on the way to the plaza.",
    story: "A short film from the street, with Sylhet Plaza ahead and the market moving around it.",
    alt: "Film of the street approaching Sylhet Plaza at night.",
  },
  {
    slug: "the-corridor",
    id: "IMG_7100",
    kind: "photo",
    name: "The Corridor",
    collection: "zindabazar",
    category: "Visit",
    line: "Inside Sylhet Plaza, before the salon.",
    story: "The market corridor that leads to the salon: polished floor, shopfronts, and the turn toward Jhuma.",
    alt: "Interior corridor of Sylhet Plaza market at night.",
  },
  {
    slug: "fourth-floor",
    id: "IMG_7101",
    kind: "photo",
    name: "Fourth Floor",
    collection: "zindabazar",
    category: "Visit",
    line: "The fourth-floor corridor, wider.",
    story: "A wider still of the corridor on the floor where the salon sits.",
    alt: "Wide photograph of the fourth-floor corridor in Sylhet Plaza.",
  },
  {
    slug: "through-the-market",
    id: "IMG_7099",
    kind: "film",
    name: "Through the Market",
    collection: "zindabazar",
    category: "Visit",
    line: "Walking the corridor toward the salon.",
    story: "A film down the corridor of Sylhet Plaza, the way a visit actually begins.",
    alt: "Film walking through the corridor of Sylhet Plaza market.",
  },
  {
    slug: "the-quarter",
    id: "IMG_7102",
    kind: "film",
    name: "The Quarter",
    collection: "zindabazar",
    category: "Visit",
    line: "The jewellery quarter around the plaza.",
    story:
      "Zindabazar at night is a run of illuminated jewellers. This film is of the quarter itself. Jhuma is a few steps on, on the fourth floor.",
    alt: "Night film of illuminated jewellery shopfronts in the Zindabazar quarter.",
  },
];

export const PIECES: Piece[] = DRAFTS.map(piece);

export const CATEGORIES: Category[] = ["Sets", "Chains", "Rings", "Earrings", "Salon", "Visit"];

export const getCollection = (slug: string) => COLLECTIONS.find((c) => c.slug === slug);
export const getPiece = (slug: string) => PIECES.find((p) => p.slug === slug);
export const piecesIn = (slug: string) => PIECES.filter((p) => p.collection === slug);

export const formatPrice = (price: number | null) =>
  price === null ? "Quoted in the salon" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
