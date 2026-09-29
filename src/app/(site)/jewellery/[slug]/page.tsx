import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PieceCard } from "@/components/site/piece-card";
import { PieceDetail } from "@/components/site/piece-detail";
import { getCollection, getPiece, PIECES, piecesIn } from "@/lib/catalog";

export function generateStaticParams() {
  return PIECES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/jewellery/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const piece = getPiece(slug);
  return piece ? { title: piece.name, description: piece.line } : {};
}

export default async function PiecePage(props: PageProps<"/jewellery/[slug]">) {
  const { slug } = await props.params;
  const piece = getPiece(slug);
  if (!piece) notFound();
  const collection = getCollection(piece.collection)!;
  const related = piecesIn(piece.collection).filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <PieceDetail piece={piece} collection={collection} />
      {related.length ? (
        <section className="section">
          <div className="section-head">
            <h2 className="section-heading">Also in {collection.name}</h2>
          </div>
          <div className="grid">
            {related.map((p) => (
              <PieceCard key={p.slug} piece={p} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
