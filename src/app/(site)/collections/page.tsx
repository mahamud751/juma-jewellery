import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { COLLECTIONS, getPiece, piecesIn } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Collections",
  description: "Sets, chains, rings, earrings, the salon, and the way to Jhuma Jewellers in Zindabazar.",
};

export default function CollectionsPage() {
  return (
    <>
      <section className="page-hero">
        <Reveal as="p" className="eyebrow">
          Jhuma Jewellers
        </Reveal>
        <Reveal as="h1" className="page-title" delay={0.1}>
          Six ways
          <br />
          into the room.
        </Reveal>
        <Reveal as="p" className="page-lede" delay={0.2}>
          Every photograph and every film on this site was made in the salon, or on the street that leads to it.
        </Reveal>
      </section>

      <section className="c-rows">
        {COLLECTIONS.map((c, index) => {
          const signature = getPiece(c.signature)!;
          const count = piecesIn(c.slug).length;
          return (
            <article key={c.slug} className={`c-row ${index % 2 ? "is-flipped" : ""}`} style={{ ["--accent" as string]: c.accent }}>
              <Link href={`/collections/${c.slug}`} className="c-row-stage" data-cursor="Enter">
                <img src={signature.poster} alt={signature.alt} />
              </Link>
              <Reveal className="c-row-text" delay={0.1}>
                <p className="eyebrow">
                  Collection {c.numeral} · {count} frames
                </p>
                <h2 className="c-row-name">{c.name}</h2>
                <p className="c-row-tag">{c.tagline}</p>
                <p className="c-row-story">{c.story}</p>
                <Link href={`/collections/${c.slug}`} className="line-btn">
                  <span>Explore {c.name}</span>
                </Link>
              </Reveal>
            </article>
          );
        })}
      </section>
    </>
  );
}
