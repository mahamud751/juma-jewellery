"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BOUTIQUES, ROOMS, SHOP_STEP, SHOP_STOPS, sampleRoute } from "@/lib/shop";
import "@/app/shop.css";

const ShopStage = dynamic(() => import("@/components/shop-stage"), { ssr: false });
const LAST_STOP = SHOP_STOPS.length - 1;

export function ShopExperience() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const [look, setLook] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const boutique = BOUTIQUES[active - 2];
  const piece = boutique?.pieces.find((item) => item.slug === selected);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => { setReduced(media.matches); window.dispatchEvent(new Event("shop-scroll")); };
    preference();
    media.addEventListener("change", preference);
    let frame = 0;
    let lastScroll = window.scrollY;
    const sync = () => {
      frame = 0;
      const value = Math.min(LAST_STOP, Math.max(0, window.scrollY / (window.innerHeight * SHOP_STEP)));
      progress.current = value;
      if (Math.abs(window.scrollY - lastScroll) > 2) { setSelected(null); setLook(0); }
      lastScroll = window.scrollY;
      setActive(Math.round(value));
      if (root.current) {
        root.current.style.height = `${window.innerHeight * (1 + LAST_STOP * SHOP_STEP)}px`;
        root.current.style.setProperty("--journey", `${value / LAST_STOP}`);
        root.current.style.setProperty("--settled", String(Math.max(0, 1 - Math.abs(value - Math.round(value)) * 4)));
        root.current.dataset.travelling = String(Math.abs(value - Math.round(value)) > .25);
      }
      root.current?.querySelectorAll<HTMLElement>(".shop-copy").forEach((panel, index) => {
        const distance = Math.abs(value - index);
        panel.style.opacity = String(Math.max(0, 1 - Math.max(0, distance - .08) * 4));
        panel.style.transform = `translateY(${media.matches ? 0 : (index - value) * 24}px)`;
        panel.inert = distance > .3;
        panel.setAttribute("aria-hidden", String(distance > .3));
      });
      const camera = sampleRoute(value);
      const marker = root.current?.querySelector(".shop-map-marker");
      marker?.setAttribute("cx", String((camera.position[0] + 21) * 18 / 7));
      marker?.setAttribute("cy", String((camera.position[2] + 35) * 18 / 7));
      window.dispatchEvent(new Event("shop-scroll"));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSelected(null); setMapOpen(false); setLook(0); }
    };
    sync();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", preference);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const visit = useCallback((index: number) => {
    setSelected(null);
    setLook(0);
    setMapOpen(false);
    window.scrollTo({ top: Math.max(0, Math.min(LAST_STOP, index)) * window.innerHeight * SHOP_STEP, behavior: reduced ? "instant" : "smooth" });
  }, [reduced]);
  const select = useCallback((slug: string) => {
    const stop = BOUTIQUES.findIndex((room) => room.pieces.some((item) => item.slug === slug)) + 2;
    if (stop !== active) { visit(stop); return; }
    setSelected(slug);
    setLook(0);
  }, [active, visit]);

  return (
    <div ref={root} className="shop-journey" data-selected={Boolean(piece)} data-stop={active} style={{ height: `${100 + LAST_STOP * SHOP_STEP * 100}svh` }}>
      <div className="shop-world" aria-hidden="true">
        {!failed && <ShopBoundary onError={() => setFailed(true)}><ShopStage progress={progress} reduced={reduced} active={active} look={look} selected={selected} onSelect={select} /></ShopBoundary>}
      </div>
      <div className="shop-shade" aria-hidden="true" />
      <header className="shop-header">
        <Link href="/" className="shop-brand" aria-label="Jhuma Jewellers home">JHUMA<span>THE SALON</span></Link>
        <div className="shop-location"><span className="shop-live-dot" /> {active === 0 ? "Zindabazar, Sylhet" : SHOP_STOPS[active]}</div>
        <nav aria-label="Main navigation"><Link href="/collections">Collections</Link><Link href="/appointment" className="shop-reserve">Private appointment <span>↗</span></Link></nav>
      </header>

      <main className="shop-stories">
        <section className="shop-copy shop-opening">
          <p className="shop-kicker">Sylhet Plaza · Fourth floor</p>
          <h1>Walk the salon.<br /><em>The gold is real.</em></h1>
          <p className="shop-description">Four rooms, and the jewellery photographed inside them.<br />Scroll to walk. The walls carry the salon.</p>
          <button className="shop-link" onClick={() => visit(1)}>Enter the salon <span>↓</span></button>
          <div className="shop-opening-note"><span>4 rooms</span><i /><span>The real gold</span><i /><span>Your own pace</span></div>
        </section>
        <section className="shop-copy shop-atrium-copy" style={{ opacity: 0 }} aria-hidden="true" inert={active !== 1}>
          <p className="shop-kicker">01 / The grand atrium</p>
          <h2>Every turn,<br /><em>a room of gold.</em></h2>
          <p className="shop-description">Silence is through the west doors. The pictures on these walls were taken in the salon at Zindabazar.</p>
          <button className="shop-link" onClick={() => visit(2)}>Step into Silence <span>↰</span></button>
        </section>
        {BOUTIQUES.map((room, index) => (
          <section className="shop-copy shop-boutique-copy" key={room.name} style={{ opacity: 0 }} aria-hidden="true" inert={active !== index + 2}>
            <p className="shop-kicker">0{index + 2} / {room.direction} <span className="shop-room-count">{room.pieces.length} pieces</span></p>
            <h2>{room.name}<em>{room.subtitle}</em></h2>
            <p className="shop-description">{room.description}</p>
            <Link href={room.href} className="shop-room-link">The full collection ↗</Link>
          </section>
        ))}
        <section className="shop-copy shop-salon-copy" style={{ opacity: 0 }} aria-hidden="true" inert={active !== LAST_STOP}>
          <p className="shop-kicker">06 / The private salon</p>
          <h2>Sit with the gold.<br /><em>Take your time.</em></h2>
          <p className="shop-description">The salon, filmed as you turn through it. Ask for a viewing upstairs, or look through every piece.</p>
          <Link href="/appointment" className="shop-link">Book a private appointment <span>↗</span></Link>
          <Link href="/jewellery" className="shop-secondary">Browse all jewellery</Link>
        </section>
      </main>

      <div className="shop-walking" aria-hidden="true"><span className="shop-walk-line" />Follow the light. The next room awaits.</div>

      {boutique && <section className="shop-piece-tray" aria-label={`${boutique.name} pieces`}>
        <div className="shop-tray-heading"><span>{boutique.subtitle}</span><span>Select a piece to look closer ↗</span></div>
        <div className="shop-pieces" style={{ gridTemplateColumns: `repeat(${boutique.pieces.length}, minmax(0, 1fr))` }}>
          {boutique.pieces.map((item, index) => <button key={item.slug} className={selected === item.slug ? "is-selected" : ""} onClick={() => select(item.slug)} aria-pressed={selected === item.slug}>
            <span className="shop-piece-number">0{index + 1}</span><span className="shop-piece-label">{item.name}<small>{item.category} <span>·</span> {item.kind === "film" ? "Film" : "Photograph"}</small></span><span className="shop-piece-arrow">↗</span>
          </button>)}
        </div>
      </section>}

      {piece && <aside className="shop-piece-detail" aria-label={piece.name}>
        <button className="shop-detail-close" onClick={() => setSelected(null)} aria-label="Return to room">×</button>
        <p className="shop-kicker">A closer look / {boutique.name}</p><h3>{piece.name}</h3>
        <p>{piece.line}</p><div className="shop-detail-spec"><span>{piece.kind === "film" ? "Film" : "Photograph"}</span><span>Yellow gold</span></div>
        <Link href={`/jewellery/${piece.slug}`} className="shop-link">Discover this piece <span>↗</span></Link>
        <button className="shop-secondary" onClick={() => setSelected(null)}>← Back to the room</button>
      </aside>}

      <div className="shop-look" aria-label="Look around the room">
        <button aria-label="Look left" onClick={() => { setSelected(null); setLook((angle) => Math.min(1.2, angle + .4)); }}>←</button>
        <button onClick={() => { setSelected(null); setLook(0); }}>{look === 0 ? "Look around" : "Centre view"}</button>
        <button aria-label="Look right" onClick={() => { setSelected(null); setLook((angle) => Math.max(-1.2, angle - .4)); }}>→</button>
      </div>

      <button className="shop-map-toggle" onClick={() => setMapOpen(!mapOpen)} aria-expanded={mapOpen} aria-controls="shop-floorplan">{mapOpen ? "Close map ×" : "Floor plan ⌘"}</button>
      <nav id="shop-floorplan" className="shop-map" data-open={mapOpen} aria-label="Salon floor plan">
        <div className="shop-map-title">THE SALON<span>FOURTH FLOOR</span></div>
        <svg viewBox="0 0 116 140" role="img" aria-label="Connected rooms: atrium, left to Silence, north to Instinct, right to Constant, north to Nocturne, right to the salon">
          {ROOMS.map((room) => <rect key={room.name} x={(room.center[0] + 21) * 18 / 7 - 16} y={(room.center[2] + 35) * 18 / 7 - 16} width="32" height="32" rx="1" className={active === room.stop ? "is-current" : ""} />)}
          <path d="M54 130V90H18V54H54V18H90" />
          {ROOMS.map((room) => <text key={room.name} x={(room.center[0] + 21) * 18 / 7} y={(room.center[2] + 35) * 18 / 7 + 2}>{String(room.stop).padStart(2, "0")}</text>)}
          <circle className="shop-map-marker" cx="54" cy="126" r="2.8" />
        </svg>
        <div className="shop-map-stops">{SHOP_STOPS.map((stop, index) => <button key={stop} onClick={() => visit(index)} aria-label={stop} aria-current={active === index ? "step" : undefined}><span>{String(index).padStart(2, "0")}</span>{stop}</button>)}</div>
      </nav>

      <footer className="shop-bottom"><span>JHUMA JEWELLERS <span className="shop-bottom-divider">/</span> {String(active).padStart(2, "0")} — {SHOP_STOPS[active]}</span><div><button onClick={() => visit(active - 1)} disabled={active === 0} aria-label="Previous room">↑</button><button onClick={() => visit(active === LAST_STOP ? 0 : active + 1)}>{active === LAST_STOP ? "Return to entrance" : "Scroll to the next room"}<span>{active === LAST_STOP ? "↺" : "↓"}</span></button></div></footer>
      <div className="shop-progress" aria-hidden="true" />
      <p className="sr-only" aria-live="polite">{SHOP_STOPS[active]}{boutique ? `, ${boutique.pieces.length} pieces on display.` : ""}</p>
      {failed && <p className="shop-fallback-note">The 3D tour is unavailable. Use the floor plan and collection links to explore the salon.</p>}
    </div>
  );
}

class ShopBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
