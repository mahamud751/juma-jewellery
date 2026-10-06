"use client";

import Link from "next/link";
import { useEffect } from "react";
import { COLLECTIONS } from "@/lib/catalog";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/walk", label: "Walk to the salon" },
  { href: "/collections", label: "Collections" },
  { href: "/jewellery", label: "Every frame" },
  { href: "/maison", label: "The Salon" },
  { href: "/appointment", label: "Book a visit" },
];

export function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const tab = open ? 0 : -1;

  return (
    <div className={`menu ${open ? "is-open" : ""}`} aria-hidden={!open} role="dialog" aria-label="Site menu">
      <nav className="menu-main">
        <ol>
          {LINKS.map((link, index) => (
            <li key={link.href} style={{ ["--d" as string]: `${0.1 + index * 0.06}s` }}>
              <Link href={link.href} onClick={onClose} tabIndex={tab}>
                <span className="menu-no">{String(index + 1).padStart(2, "0")}</span>
                <span className="menu-label">{link.label}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
      <aside className="menu-side">
        <p className="eyebrow">Collections</p>
        <ul>
          {COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <Link href={`/collections/${c.slug}`} onClick={onClose} tabIndex={tab}>
                <span className="menu-numeral">{c.numeral}</span> {c.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="eyebrow">Client care</p>
        <ul>
          <li>
            <Link href="/wishlist" onClick={onClose} tabIndex={tab}>Wishlist</Link>
          </li>
          <li>
            <Link href="/appointment" onClick={onClose} tabIndex={tab}>Private viewings</Link>
          </li>
        </ul>
      </aside>
    </div>
  );
}
