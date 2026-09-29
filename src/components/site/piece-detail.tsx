import Link from "next/link";
import { MediaFrame } from "@/components/site/media-frame";
import { WishButton } from "@/components/site/piece-card";
import type { Collection, Piece } from "@/lib/catalog";

const NOTES = [
  {
    title: "In the salon",
    body: "Every frame on this page was made inside Jhuma Jewellers, or on the way to the door. The piece you are looking at is on display in Zindabazar.",
  },
  {
    title: "Price",
    body: "Gold is priced by weight and making charge, and both move. The salon quotes the piece in front of you. Nothing on this site is a fixed price.",
  },
  {
    title: "Care",
    body: "Keep gold pieces separate, in a soft pouch. A soft cloth and warm water are enough for everyday wear. The salon will clean and check a piece you bought there.",
  },
];

export function PieceDetail({ piece, collection }: { piece: Piece; collection: Collection }) {
  return (
    <section className="pdp">
      <div className="pdp-stage" style={{ ["--accent" as string]: collection.accent }}>
        <MediaFrame piece={piece} variant="full" controls={piece.kind === "film"} />
      </div>

      <div className="pdp-info">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/collections">Collections</Link>
          <span>/</span>
          <Link href={`/collections/${collection.slug}`}>{collection.name}</Link>
        </nav>
        <h1 className="pdp-name">{piece.name}</h1>
        <p className="pdp-line">{piece.line}</p>
        <p className="pdp-price">{piece.kind === "film" ? "Salon film" : "Salon photograph"} · Quoted in the salon</p>

        <div className="pdp-actions">
          <Link href={`/appointment?piece=${piece.slug}`} className="solid-btn">
            Ask to see this
          </Link>
          <WishButton slug={piece.slug} label />
        </div>

        <p className="pdp-story">{piece.story}</p>

        <dl className="specs">
          {piece.specs.map(([term, value]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="accordion">
          {NOTES.map((item) => (
            <details key={item.title} className="acc">
              <summary>
                {item.title}
                <span aria-hidden="true">+</span>
              </summary>
              <div className="acc-body">
                <p>{item.body}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
