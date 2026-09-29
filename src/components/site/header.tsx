"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "@/components/site/menu";
import { useWishlist } from "@/lib/wishlist";

const NAV = [
  { href: "/collections", label: "Collections" },
  { href: "/jewellery", label: "Jewellery" },
  { href: "/maison", label: "Salon" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const { list } = useWishlist();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`site-header ${scrolled || menu ? "is-solid" : ""}`}>
        <div className="site-header-left">
          <button type="button" className="menu-btn" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
            <span className={`menu-icon ${menu ? "is-x" : ""}`} aria-hidden="true">
              <span />
              <span />
            </span>
            <span className="menu-btn-label">{menu ? "Close" : "Menu"}</span>
          </button>
          <nav className="site-nav" aria-label="Primary">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={pathname.startsWith(item.href) ? "is-active" : ""}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link href="/" className="site-logo" aria-label="Jhuma Jewellers — home" onClick={() => setMenu(false)}>
          <span className="wordmark">JHUMA</span>
        </Link>
        <div className="site-header-right">
          <Link href="/appointment" className="site-nav-cta">
            Appointment
          </Link>
          <Link href="/wishlist" className="wish-link" aria-label={`Wishlist, ${list.length} saved`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
            {list.length > 0 ? <span className="wish-count">{list.length}</span> : null}
          </Link>
        </div>
      </header>
      <Menu open={menu} onClose={() => setMenu(false)} />
    </>
  );
}
