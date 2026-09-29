import Link from "next/link";
import { COLLECTIONS, HOUSE } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-cols">
        <div className="footer-col footer-intro">
          <p className="footer-lede">Gold, kept in blue velvet. A salon on the fourth floor of Sylhet Plaza.</p>
          <Link href="/appointment" className="line-btn">
            <span>Book a visit</span>
          </Link>
        </div>
        <div className="footer-col">
          <p className="eyebrow">Collections</p>
          {COLLECTIONS.map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </div>
        <div className="footer-col">
          <p className="eyebrow">Jewellery</p>
          <Link href="/jewellery?c=Sets">Sets</Link>
          <Link href="/jewellery?c=Chains">Chains</Link>
          <Link href="/jewellery?c=Rings">Rings</Link>
          <Link href="/jewellery?c=Earrings">Earrings</Link>
        </div>
        <div className="footer-col">
          <p className="eyebrow">The house</p>
          <Link href="/maison">The salon</Link>
          <Link href="/appointment">Book a visit</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/jewellery">Every frame</Link>
        </div>
      </div>
      <p className="footer-mark wordmark" aria-hidden="true">JHUMA</p>
      <div className="footer-legal">
        <span>© {HOUSE.name}</span>
        <span>{HOUSE.address}</span>
      </div>
    </footer>
  );
}
