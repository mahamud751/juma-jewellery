"use client";

import { useEffect, useState } from "react";
import type { Piece } from "@/lib/catalog";

export function MediaFrame({
  piece,
  variant = "full",
  controls = false,
}: {
  piece: Piece;
  variant?: "hero" | "full" | "panel";
  controls?: boolean;
}) {
  const [reduced, setReduced] = useState(false);
  const [playing, setPlaying] = useState(piece.kind === "film");

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(media.matches);
      if (media.matches) setPlaying(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (piece.kind === "photo" || !playing) {
    return (
      <span className={`frame frame-${variant}`}>
        <img src={piece.poster} alt={piece.alt} fetchPriority={variant === "hero" ? "high" : "auto"} />
        {piece.kind === "film" ? (
          <button type="button" className="frame-play" onClick={() => setPlaying(true)}>
            {reduced ? "Play film" : "Play"}
          </button>
        ) : null}
      </span>
    );
  }

  return (
    <span className={`frame frame-${variant}`}>
      <video
        src={piece.src}
        poster={piece.poster}
        muted
        loop
        playsInline
        autoPlay
        controls={controls}
        aria-label={piece.alt}
      />
    </span>
  );
}
