import type { Metadata } from "next";
import { Suspense } from "react";
import { JewelleryGrid } from "@/components/site/jewellery-grid";
import { Reveal } from "@/components/site/reveal";
import { PIECES } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Jewellery",
  description: "Every photograph and film from Jhuma Jewellers: sets, chains, rings, earrings, the salon and the street.",
};

export default function JewelleryPage() {
  const films = PIECES.filter((p) => p.kind === "film").length;
  return (
    <>
      <section className="page-hero compact">
        <Reveal as="p" className="eyebrow">
          The whole salon
        </Reveal>
        <Reveal as="h1" className="page-title" delay={0.1}>
          Every frame.
        </Reveal>
        <Reveal as="p" className="page-lede" delay={0.2}>
          {PIECES.length} photographs and films. {films} of them move. All of them were made at Jhuma.
        </Reveal>
      </section>
      <section className="section">
        <Suspense>
          <JewelleryGrid pieces={PIECES} />
        </Suspense>
      </section>
    </>
  );
}
