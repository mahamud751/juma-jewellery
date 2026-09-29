"use client";

import Link from "next/link";
import { CardMedia } from "@/components/site/card-media";
import { getCollection, type Piece } from "@/lib/catalog";
import { useWishlist } from "@/lib/wishlist";

export function WishButton({ slug, label = false }: { slug: string; label?: boolean }) {
  const { has, toggle } = useWishlist();
  const saved = has(slug);
  return (
    <button
      type="button"
      className={`wish-btn ${saved ? "is-saved" : ""} ${label ? "with-label" : ""}`}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      data-cursor={saved ? "Saved" : "Save"}
      onClick={() => toggle(slug)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      </svg>
      {label ? <span>{saved ? "Saved to wishlist" : "Save to wishlist"}</span> : null}
    </button>
  );
}

export function PieceCard({ piece }: { piece: Piece }) {
  const collection = getCollection(piece.collection);
  return (
    <article className="card" style={{ ["--accent" as string]: collection?.accent }}>
      <Link href={`/jewellery/${piece.slug}`} className="card-link" data-cursor="View">
        <CardMedia piece={piece} />
        <div className="card-meta">
          <p className="card-kicker">
            {collection?.name} · {piece.kind === "film" ? "Film" : "Photograph"}
          </p>
          <h3 className="card-name">{piece.name}</h3>
          <p className="card-price">{piece.line}</p>
        </div>
      </Link>
      <WishButton slug={piece.slug} />
    </article>
  );
}
