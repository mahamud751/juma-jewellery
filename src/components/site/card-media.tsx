"use client";

import { useRef, useState } from "react";
import type { Piece } from "@/lib/catalog";

export function CardMedia({ piece }: { piece: Piece }) {
  const video = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  const stop = () => {
    setLive(false);
    if (video.current) {
      video.current.pause();
      video.current.currentTime = 0;
    }
  };

  return (
    <div className="card-stage" onMouseEnter={() => piece.kind === "film" && setLive(true)} onMouseLeave={stop}>
      <img src={piece.card} alt="" />
      {live ? (
        <video ref={video} src={piece.src} poster={piece.card} muted playsInline loop autoPlay aria-hidden="true" />
      ) : null}
      {piece.kind === "film" ? <span className="film-badge">Film</span> : null}
    </div>
  );
}
