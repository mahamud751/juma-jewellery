export type SalonVector = [number, number, number];

/** Only the six approved source photographs; 32 and 33 are deliberately excluded. */
export const SALON_PHOTOS = [31, 34, 35, 36, 37, 38] as const;
export const photoUrl = (file: number) => `/main/web/${file}.jpg`;

export const SALON_STOPS: {
  title: string; line: string; chapter: string; photo: number;
  position: SalonVector; target: SalonVector; piece?: number;
}[] = [
  { title: "A world of gold.", line: "From the heart of Sylhet, into something extraordinary.", chapter: "Zindabazar · The arrival", photo: 31, position: [0, 3.2, 39], target: [0, 3.2, 19] },
  { title: "Follow the light.", line: "The fourth floor. Your invitation is just ahead.", chapter: "Sylhet Plaza · Fourth floor", photo: 34, position: [1.4, 2.8, 18], target: [0, 2.7, 7.8] },
  { title: "Beyond these doors.", line: "A quieter world. A little closer to the extraordinary.", chapter: "Jhuma Jewellers · The entrance", photo: 35, position: [0, 2.8, 12.4], target: [0, 2.65, -4] },
  { title: "Welcome to Jhuma.", line: "Gold, blue velvet, and a room made for discovery.", chapter: "The grand salon", photo: 36, position: [0, 3.1, 4.6], target: [0, 2.8, -5] },
  { title: "Golden filigree.", line: "A floral pendant, sculpted in gold. Discover every side.", chapter: "01 / The pendant salon", photo: 37, position: [-4, 2.85, .9], target: [-4, 2.5, -3.2], piece: 0 },
  { title: "An heirloom in bloom.", line: "Petal by petal. A necklace with a story of its own.", chapter: "02 / The necklace gallery", photo: 38, position: [0, 2.9, -1], target: [0, 2.55, -5.2], piece: 1 },
  { title: "The finishing touch.", line: "Golden drops. Fine details, from every angle.", chapter: "03 / The gold atelier", photo: 38, position: [4, 2.8, .9], target: [4, 2.5, -3.2], piece: 2 },
  { title: "A moment, just for you.", line: "Take a seat. Let us help you find your piece.", chapter: "The private viewing", photo: 36, position: [2.7, 2.6, 1.8], target: [6.7, 1.1, 4.5] },
];
export const SALON_ENTRANCE = 2;
export const SALON_LAST = SALON_STOPS.length - 1;
export const DISPLAY_POSITIONS: SalonVector[] = [[-4, 2.5, -3.2], [0, 2.55, -5.2], [4, 2.5, -3.2]];

export function salonShot(value: number, portrait: boolean) {
  const p = Math.max(0, Math.min(SALON_LAST, value));
  const index = Math.min(SALON_LAST - 1, Math.floor(p));
  const t = p - index;
  const smooth = t * t * (3 - 2 * t);
  const from = SALON_STOPS[index], to = SALON_STOPS[index + 1];
  const position = from.position.map((v, i) => v + (to.position[i] - v) * smooth) as SalonVector;
  const target = from.target.map((v, i) => v + (to.target[i] - v) * smooth) as SalonVector;
  if (portrait) {
    const extra = (from.piece !== undefined ? 1.4 : 0) * (1 - smooth) + (to.piece !== undefined ? 1.4 : 0) * smooth;
    position[2] += extra;
  }
  return { position, target };
}
