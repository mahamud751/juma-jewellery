import type { Metadata } from "next";
import { Reveal } from "@/components/site/reveal";
import { WishlistView } from "@/components/site/wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <>
      <section className="page-hero compact">
        <Reveal as="p" className="eyebrow">
          Saved pieces
        </Reveal>
        <Reveal as="h1" className="page-title" delay={0.1}>
          Wishlist
        </Reveal>
      </section>
      <section className="section">
        <WishlistView />
      </section>
    </>
  );
}
