import type { Metadata } from "next";
import Link from "next/link";
import { JourneyExperience } from "@/components/journey/journey-experience";
import { PieceCard } from "@/components/site/piece-card";
import { Reveal } from "@/components/site/reveal";
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
          <section className="section house-bridge">
            <Reveal as="p" className="eyebrow house-bridge-kicker">
              Inside the house
            </Reveal>
            <Reveal as="h2" className="section-heading house-bridge-title" delay={0.12}>
              The gold,
              <br />
              as it waits.
            </Reveal>
            <Reveal as="p" className="house-bridge-line" delay={0.22}>
              After the doors, the salon opens into pieces you can browse and ask to see.
            </Reveal>
          </section>

          <section className="section">
            <Reveal className="section-head">
              <div>
                <p className="eyebrow">From the salon</p>
                <h2 className="section-heading">Popular</h2>
              </div>
              <Link href="/jewellery" className="line-btn">
                <span>All jewellery</span>
              </Link>
            </Reveal>
            <div className="grid">
              {popular.map((piece, index) => (
                <Reveal key={piece.slug} delay={0.06 * index}>
                  <PieceCard piece={piece} />
                </Reveal>
              ))}
            </div>
          </section>

          <section>
            <Reveal className="section-head collections-head">
              <div>
                <p className="eyebrow">Shop by room</p>
                <h2 className="section-heading">Collections</h2>
              </div>
              <Link href="/collections" className="line-btn">
                <span>All collections</span>
              </Link>
            </Reveal>
            <div className="home-collections">
              {COLLECTIONS.map((collection, index) => {
                const signature = getPiece(collection.signature);
                if (!signature) return null;
                return (
                  <Reveal key={collection.slug} delay={0.08 * (index % 2)}>
                    <Link href={`/collections/${collection.slug}`} className="home-tile" data-cursor="Enter">
                      <img src={signature.poster} alt={signature.alt} />
                      <span>
                        <small>
                          {collection.numeral} · {piecesIn(collection.slug).length} pieces
                        </small>
                        <strong>{collection.name}</strong>
                        <em>{collection.tagline}</em>
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>

          <section className="reviews">
            <Reveal className="section-head">
              <div>
                <p className="eyebrow">After a visit</p>
                <h2 className="section-heading">Reviews</h2>
              </div>
            </Reveal>
            <div className="review-grid">
              {REVIEWS.map((review, index) => (
                <Reveal key={review.name} as="blockquote" className="review" delay={0.1 * index}>
                  <p>“{review.quote}”</p>
                  <cite>
                    {review.name} · {review.place}
                  </cite>
                </Reveal>
              ))}
            </div>
          </section>

          <Reveal as="section" className="visit-band" delay={0.08}>
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
          </Reveal>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
