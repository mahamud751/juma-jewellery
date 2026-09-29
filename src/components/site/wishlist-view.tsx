"use client";

import Link from "next/link";
import { PieceCard } from "@/components/site/piece-card";
import { PIECES } from "@/lib/catalog";
import { useWishlist } from "@/lib/wishlist";

export function WishlistView() {
  const { list } = useWishlist();
  const saved = PIECES.filter((p) => list.includes(p.slug));

  if (!saved.length) {
    return (
      <div className="empty-state">
        <p>Nothing saved yet.</p>
        <p className="muted">Tap the heart on any piece to keep it here. Your list stays in this browser.</p>
        <Link href="/jewellery" className="line-btn">
          <span>Browse the jewellery</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid">
        {saved.map((piece) => (
          <PieceCard key={piece.slug} piece={piece} />
        ))}
      </div>
      <div className="center-actions">
        <Link href="/appointment" className="solid-btn">
          Ask to see these in the salon
        </Link>
      </div>
    </>
  );
}
