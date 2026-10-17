import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { HOUSE, PIECES, getPiece } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "About",
  description: `${HOUSE.name} is a gold salon on the fourth floor of Sylhet Plaza, Zindabazar.`,
};

const CHAPTERS = [
  {
    no: "01",
    title: "The house",
    body: "Jhuma is one salon. Royal blue velvet lines the busts and the trays. Carved gilt frames the alcove. A chandelier hangs over the counters, and the name is set in gold on the wall.",
  },
  {
    no: "02",
    title: "The gold",
    body: "Sets, chains, rings and earrings are laid out so each piece can be seen on its own. A necklace has its earrings beside it. A ring has its own cushion. A chain hangs by the length.",
  },
  {
    no: "03",
    title: "How it is sold",
    body: "Nothing on this site carries a fixed price. Gold is quoted in the salon, by weight and making charge, when the piece is on the counter in front of you.",
  },
];

export default function AboutPage() {
  const room = getPiece("chandelier-room")!;
  const street = getPiece("plaza-street")!;

  return (
    <>
      <section className="page-hero">
        <Reveal as="p" className="eyebrow">
          {HOUSE.bengali}
        </Reveal>
        <Reveal as="h1" className="page-title" delay={0.1}>
          About
          <br />
          the house.
        </Reveal>
        <Reveal as="p" className="page-lede" delay={0.2}>
          {HOUSE.name} shows gold the way the room holds it. The photographs on this site were made in that room, and on the street outside Sylhet Plaza.
        </Reveal>
      </section>

      <section className="maison-pair">
        <Link href={`/jewellery/${room.slug}`} className="frame" data-cursor="View">
          <img src={room.poster} alt={room.alt} />
          <span>The salon</span>
        </Link>
        <Link href={`/jewellery/${street.slug}`} className="frame" data-cursor="View">
          <img src={street.poster} alt={street.alt} />
          <span>Zindabazar</span>
        </Link>
      </section>

      <section className="chapters-list">
        {CHAPTERS.map((chapter) => (
          <Reveal key={chapter.no} as="article" className="chapter-row">
            <p className="chapter-no">{chapter.no}</p>
            <h2 className="chapter-title">{chapter.title}</h2>
            <p className="chapter-body">{chapter.body}</p>
          </Reveal>
        ))}
      </section>

      <section className="stone-band">
        <div className="stats">
          <div className="stat">
            <p className="stat-value">4th</p>
            <p className="stat-label">Floor of Sylhet Plaza, above the market corridor</p>
          </div>
          <div className="stat">
            <p className="stat-value">{PIECES.length}</p>
            <p className="stat-label">Photographs and films, all made in the house</p>
          </div>
          <div className="stat">
            <p className="stat-value">Gold</p>
            <p className="stat-label">Priced by weight and making charge, at the counter</p>
          </div>
        </div>
      </section>

      <section className="cta-band section">
        <p>A seat at the counter, when you are ready.</p>
        <div className="hero-actions">
          <Link href="/contact" className="solid-btn">
            Contact
          </Link>
          <Link href="/jewellery" className="line-btn">
            <span>See the jewellery</span>
          </Link>
        </div>
      </section>
    </>
  );
}
