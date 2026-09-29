import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { HOUSE, getPiece, PIECES } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "The Salon",
  description: "Jhuma Jewellers is a gold salon on the fourth floor of Sylhet Plaza, Zindabazar.",
};

const STATS = [
  ["4th", "Floor of Sylhet Plaza, above the market corridor"],
  [String(PIECES.length), "Photographs and films, all made in the house"],
  ["1", "Room: blue velvet, carved wood, one chandelier"],
  ["Gold", "Priced by weight and making charge, at the counter"],
];

const CHAPTERS = [
  {
    no: "01",
    title: "The room",
    body: "Jhuma is a single salon. Royal blue velvet lines the busts and the trays. Carved gilt frames the alcove. A chandelier hangs over the counters, and the name is set in gold on the wall.",
  },
  {
    no: "02",
    title: "The gold",
    body: "Sets, chains, rings and earrings are laid out so each one can be seen on its own. A necklace has its earrings beside it. A ring has its own cushion. A chain hangs by the length.",
  },
  {
    no: "03",
    title: "The visit",
    body: "The salon is on the fourth floor of Sylhet Plaza, in Zindabazar. At night the glass front is lit, and the sets are visible from the corridor before you come in. Ask at the counter, and a piece is brought out.",
  },
];

export default function MaisonPage() {
  const room = getPiece("chandelier-room")!;
  const mark = getPiece("the-mark-film")!;
  const street = getPiece("plaza-street")!;

  return (
    <>
      <section className="page-hero">
        <Reveal as="p" className="eyebrow">
          {HOUSE.bengali}
        </Reveal>
        <Reveal as="h1" className="page-title" delay={0.1}>
          The salon,
          <br />
          as it stands.
        </Reveal>
        <Reveal as="p" className="page-lede" delay={0.2}>
          {HOUSE.name} shows gold the way the room holds it. These pages use the photographs and films from that room, and from the street outside.
        </Reveal>
      </section>

      <section className="stone-band">
        <Link href={`/jewellery/${room.slug}`} className="stone-view maison-photo" data-cursor="View">
          <img src={room.poster} alt={room.alt} />
        </Link>
        <div className="stats">
          {STATS.map(([value, label], i) => (
            <Reveal key={label} className="stat" delay={i * 0.08}>
              <p className="stat-value">{value}</p>
              <p className="stat-label">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="chapters-list">
        {CHAPTERS.map((c) => (
          <Reveal key={c.no} as="article" className="chapter-row">
            <p className="chapter-no">{c.no}</p>
            <h2 className="chapter-title">{c.title}</h2>
            <p className="chapter-body">{c.body}</p>
          </Reveal>
        ))}
      </section>

      <section className="maison-pair">
        <Link href={`/jewellery/${mark.slug}`} data-cursor="Play">
          <img src={mark.poster} alt={mark.alt} />
          <span>The mark, filmed in the room</span>
        </Link>
        <Link href={`/jewellery/${street.slug}`} data-cursor="View">
          <img src={street.poster} alt={street.alt} />
          <span>Sylhet Plaza, from the street</span>
        </Link>
      </section>

      <Reveal as="blockquote" className="quote">
        <p>Come up to the fourth floor. The gold is already on the velvet.</p>
        <cite>{HOUSE.address}</cite>
      </Reveal>

      <section className="cta-band">
        <Link href="/collections" className="line-btn">
          <span>See the collections</span>
        </Link>
        <Link href="/appointment" className="solid-btn">
          Book a visit
        </Link>
      </section>
    </>
  );
}
