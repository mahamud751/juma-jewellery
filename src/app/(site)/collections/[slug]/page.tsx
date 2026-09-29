import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PieceCard } from "@/components/site/piece-card";
import { Reveal } from "@/components/site/reveal";
import { COLLECTIONS, getCollection, getPiece, piecesIn } from "@/lib/catalog";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = getCollection(slug);
  return c ? { title: c.name, description: c.tagline } : {};
}

export default async function CollectionPage(props: PageProps<"/collections/[slug]">) {
  const { slug } = await props.params;
  const collection = getCollection(slug);
  if (!collection) notFound();
  const signature = getPiece(collection.signature)!;
  const pieces = piecesIn(slug);
  const index = COLLECTIONS.indexOf(collection);
  const next = COLLECTIONS[(index + 1) % COLLECTIONS.length];

  return (
    <div style={{ ["--accent" as string]: collection.accent }}>
      <section className="ch-hero">
        <div className="ch-hero-text">
          <Reveal as="p" className="eyebrow">
            Collection {collection.numeral}
          </Reveal>
          <Reveal as="h1" className="ch-title" delay={0.1}>
            {collection.name}
          </Reveal>
          <Reveal as="p" className="ch-tag" delay={0.2}>
            {collection.tagline}
          </Reveal>
          <Reveal as="p" className="ch-story" delay={0.3}>
            {collection.story}
          </Reveal>
          <Reveal delay={0.4}>
            <Link href={`/jewellery/${signature.slug}`} className="line-btn">
              <span>The signature: {signature.name}</span>
            </Link>
          </Reveal>
        </div>
        <Link href={`/jewellery/${signature.slug}`} className="ch-hero-stage" data-cursor="View">
          <img src={signature.poster} alt={signature.alt} />
        </Link>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-heading">Every frame</h2>
          <p className="muted">{pieces.length} photographs and films</p>
        </div>
        <div className="grid">
          {pieces.map((piece) => (
            <PieceCard key={piece.slug} piece={piece} />
          ))}
        </div>
      </section>

      <Link href={`/collections/${next.slug}`} className="next-band" style={{ ["--accent" as string]: next.accent }}>
        <span className="eyebrow">Next collection</span>
        <span className="next-name">
          {next.numeral} — {next.name}
        </span>
        <span className="next-tag">{next.tagline}</span>
      </Link>
    </div>
  );
}
