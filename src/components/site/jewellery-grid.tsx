"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PieceCard } from "@/components/site/piece-card";
import { CATEGORIES, COLLECTIONS, type Category, type Kind, type Piece } from "@/lib/catalog";

type Medium = "all" | Kind;

export function JewelleryGrid({ pieces }: { pieces: Piece[] }) {
  const params = useSearchParams();
  const initial = params.get("c");
  const [category, setCategory] = useState<Category | "All">(
    CATEGORIES.includes(initial as Category) ? (initial as Category) : "All",
  );
  const [collection, setCollection] = useState<string>("all");
  const [medium, setMedium] = useState<Medium>("all");

  const shown = pieces.filter((p) => {
    if (category !== "All" && p.category !== category) return false;
    if (collection !== "all" && p.collection !== collection) return false;
    if (medium !== "all" && p.kind !== medium) return false;
    return true;
  });

  return (
    <>
      <div className="filters">
        <div className="tabs" role="tablist" aria-label="Category">
          {(["All", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              className={category === c ? "is-active" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
              <sup>{c === "All" ? pieces.length : pieces.filter((p) => p.category === c).length}</sup>
            </button>
          ))}
        </div>
        <div className="selects">
          <label className="select">
            <span>Collection</span>
            <select value={collection} onChange={(e) => setCollection(e.target.value)}>
              <option value="all">All</option>
              {COLLECTIONS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="select">
            <span>Medium</span>
            <select value={medium} onChange={(e) => setMedium(e.target.value as Medium)}>
              <option value="all">Photographs and films</option>
              <option value="photo">Photographs</option>
              <option value="film">Films</option>
            </select>
          </label>
        </div>
      </div>

      {shown.length ? (
        <div className="grid">
          {shown.map((piece) => (
            <PieceCard key={piece.slug} piece={piece} />
          ))}
        </div>
      ) : (
        <p className="empty">Nothing in this combination. Try another collection.</p>
      )}
    </>
  );
}
