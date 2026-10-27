import type { Metadata } from "next";
import Link from "next/link";
import { JourneyExperience } from "@/components/journey/journey-experience";
import { PieceCard } from "@/components/site/piece-card";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { COLLECTIONS, HOUSE, getPiece, piecesIn } from "@/lib/catalog";
import "./(site)/site.css";

export const metadata: Metadata = {
  title: { absolute: "Jhuma Jewellers — Walk into the salon" },
  description: "Walk from Zindabazar into Jhuma Jewellers, then see the popular pieces, reviews, and the house.",
};

const POPULAR = ["floral-har", "chain-boards", "fan-pendant", "ring-counter", "earring-trays", "lotus-cascade"];

const REVIEWS = [
  {
    quote: "The sets were laid out on blue velvet, and we could see the earrings beside the necklace before we asked to try anything.",
    name: "Nusrat",
    place: "Sylhet",
  },
  {
    quote: "We came for a chain and left with the weight and the making charge explained at the counter. Nothing was rushed.",
    name: "Farhan",
    place: "Zindabazar",
  },
  {
    quote: "Fourth floor, at the end of the corridor. The room is small, the gold is easy to see, and they brought the rings out one by one.",
    name: "Maliha",
    place: "Sylhet",
  },
];

export default function HomePage() {
  const visit = getPiece("night-frontage")!;
  const popular = POPULAR.map((slug) => getPiece(slug)).filter((piece) => piece !== undefined);

  return (
    <>
      <JourneyExperience end={3} />
      <div id="house" className="site home-site">
        <div className="grain" aria-hidden="true" />
        <SiteHeader />
        <main className="site-main">
          <section className="section">
            <div className="section-head">
              <div>
                <p className="eyebrow">From the salon</p>
                <h2 className="section-heading">Popular</h2>
              </div>
              <Link href="/jewellery" className="line-btn">
                <span>All jewellery</span>
              </Link>
            </div>
            <div className="grid">
              {popular.map((piece) => (
                <PieceCard key={piece.slug} piece={piece} />
              ))}
            </div>
          </section>

          <section>
            <div className="section-head" style={{ margin: "0 5rem" }}>
              <div>
                <p className="eyebrow">Shop by room</p>
                <h2 className="section-heading">Collections</h2>
              </div>
              <Link href="/collections" className="line-btn">
                <span>All collections</span>
              </Link>
            </div>
            <div className="home-collections">
              {COLLECTIONS.map((collection) => {
                const signature = getPiece(collection.signature);
                if (!signature) return null;
                return (
                  <Link key={collection.slug} href={`/collections/${collection.slug}`} className="home-tile" data-cursor="Enter">
                    <img src={signature.poster} alt={signature.alt} />
                    <span>
                      <small>
                        {collection.numeral} · {piecesIn(collection.slug).length} pieces
                      </small>
                      <strong>{collection.name}</strong>
                      <em>{collection.tagline}</em>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="reviews">
            <div className="section-head">
              <div>
                <p className="eyebrow">After a visit</p>
                <h2 className="section-heading">Reviews</h2>
              </div>
            </div>
            <div className="review-grid">
              {REVIEWS.map((review) => (
                <blockquote key={review.name} className="review">
                  <p>“{review.quote}”</p>
                  <cite>
                    {review.name} · {review.place}
                  </cite>
                </blockquote>
              ))}
            </div>
          </section>

          <section className="visit-band">
            <div>
              <p className="eyebrow">Visit</p>
              <h2>Come to the counter.</h2>
              <p>
                {HOUSE.address}. Ask for a piece and it is brought out. Gold is quoted by weight and making charge, in the salon.
              </p>
              <div className="hero-actions">
                <Link href="/contact" className="solid-btn">
                  Contact
                </Link>
                <Link href="/about" className="line-btn">
                  <span>About the house</span>
                </Link>
              </div>
            </div>
            <Link href="/contact" className="visit-frame" data-cursor="Visit">
              <img src={visit.poster} alt={visit.alt} />
            </Link>
          </section>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
