"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SALON_ENTRANCE, SALON_LAST, SALON_STOPS, photoUrl } from "@/lib/salon";
import type { LookState } from "./gold-creations";
import "@/app/salon.css";

const SalonStage = dynamic(() => import("./salon-stage"), { ssr: false });

export function SalonExperience() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const look = useRef<LookState>({ yaw: 0, pitch: 0 });
  const activeRef = useRef(0);
  const moving = useRef(false);
  const animation = useRef(0);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [travelling, setTravelling] = useState(false);
  const [explore, setExplore] = useState(false);
  const [reference, setReference] = useState(false);
  const stop = SALON_STOPS[active];
  const fail = useCallback(() => { setFailed(true); setReady(true); }, []);
  const loaded = useCallback(() => setReady(true), []);
  const wake = () => window.dispatchEvent(new Event("salon-scroll"));
  const resetLook = useCallback(() => { look.current = { yaw: 0, pitch: 0 }; wake(); }, []);

  const visit = useCallback((next: number) => {
    const index = Math.max(0, Math.min(SALON_LAST, next));
    if (index === activeRef.current) return;
    cancelAnimationFrame(animation.current);
    const from = progress.current;
    activeRef.current = index;
    setActive(index);
    setExplore(false);
    setReference(false);
    resetLook();
    const duration = reduced ? 0 : Math.min(3000, 1450 + Math.abs(index - from) * 180);
    const start = performance.now();
    moving.current = true;
    setTravelling(true);
    const tick = (now: number) => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      const eased = t * t * (3 - 2 * t);
      progress.current = from + (index - from) * eased;
      root.current?.style.setProperty("--progress", String(progress.current / SALON_LAST));
      wake();
      if (t < 1) animation.current = requestAnimationFrame(tick);
      else { moving.current = false; setTravelling(false); }
    };
    animation.current = requestAnimationFrame(tick);
  }, [reduced, resetLook]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduced(media.matches);
    preference();
    media.addEventListener("change", preference);
    return () => { media.removeEventListener("change", preference); cancelAnimationFrame(animation.current); };
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let gathered = 0, lastWheel = 0, spent = false;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || reference) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheel > 180) { gathered = 0; spent = false; }
      lastWheel = now;
      if (moving.current || spent) return;
      gathered += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (Math.abs(gathered) >= 38) { visit(activeRef.current + Math.sign(gathered)); spent = true; gathered = 0; }
    };
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("button, a, input, textarea, select")) return;
      if (event.key === "Escape") { setExplore(false); setReference(false); resetLook(); }
      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") { event.preventDefault(); if (!moving.current) visit(activeRef.current + 1); }
      if (event.key === "ArrowUp" || event.key === "PageUp") { event.preventDefault(); if (!moving.current) visit(activeRef.current - 1); }
      if (event.key === "Home") { event.preventDefault(); visit(0); }
      if (event.key === "End") { event.preventDefault(); visit(SALON_LAST); }
      if (activeRef.current >= 3 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault(); setExplore(true);
        look.current.yaw += event.key === "ArrowLeft" ? -.35 : .35;
        wake();
      }
    };
    element.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    return () => { element.removeEventListener("wheel", wheel); window.removeEventListener("keydown", key); };
  }, [visit, reference, resetLook]);

  const pointer = useRef<{ id: number; x: number; y: number; startY: number; startX: number } | null>(null);
  const rotate = (amount: number) => { setExplore(true); look.current.yaw += amount; wake(); };
  return <div ref={root} className="salon-journey" data-travelling={travelling} data-explore={explore} data-piece={stop.piece !== undefined} data-ready={ready}>
    <div className="salon-world" aria-hidden="true" style={{ backgroundImage: `url(${photoUrl(stop.photo)})` }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, startY: event.clientY, startX: event.clientX };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const last = pointer.current;
        if (!last || last.id !== event.pointerId || !explore || moving.current) return;
        look.current.yaw += (event.clientX - last.x) * .009;
        look.current.pitch = Math.max(-.65, Math.min(.65, look.current.pitch + (event.clientY - last.y) * .006));
        last.x = event.clientX; last.y = event.clientY;
        wake();
      }}
      onPointerUp={(event) => {
        const last = pointer.current;
        pointer.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        if (!last || explore || moving.current) return;
        const dy = last.startY - event.clientY, dx = last.startX - event.clientX;
        if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx)) visit(activeRef.current + Math.sign(dy));
      }}
      onPointerCancel={() => { pointer.current = null; }}>
      {!failed && <StageBoundary onError={fail}><SalonStage progress={progress} look={look} active={active} reduced={reduced} onFailure={fail} onReady={loaded} /></StageBoundary>}
    </div>
    <div className="salon-shade" aria-hidden="true" />
    <header className="salon-header">
      <button className="salon-brand" onClick={() => visit(0)} aria-label="Return to Sylhet Plaza">JHUMA<span>J E W E L L E R S</span></button>
      <span className="salon-address"><i /> {active === 0 ? "Zindabazar, Sylhet" : travelling ? "Your journey continues" : "The Jhuma salon"}</span>
      <nav aria-label="Main navigation"><Link href="/collections">Collections</Link><Link href="/appointment">Private viewing <span>↗</span></Link></nav>
    </header>
    <main className="salon-copy" aria-hidden={travelling} inert={travelling}>
      <p className="salon-eyebrow">{stop.chapter}</p>
      <h1>{stop.title}</h1>
      <p className="salon-line">{stop.line}</p>
      {active === 0 && <button className="salon-enter" onClick={() => visit(1)}>Begin the journey <span>↓</span></button>}
      {active === SALON_ENTRANCE && <button className="salon-enter" onClick={() => visit(3)}>Open the doors <span>↓</span></button>}
      {stop.piece !== undefined && <button className="salon-enter" onClick={() => setExplore(!explore)} aria-pressed={explore}>{explore ? "Finish exploring" : "Explore this piece in 360°"}<span>⟳</span></button>}
      {active === SALON_LAST && <Link className="salon-enter" href="/appointment">Arrange your private viewing <span>↗</span></Link>}
      {active >= 3 && <button className="salon-reference-link" onClick={() => setReference(!reference)} aria-expanded={reference} aria-controls="salon-reference">{reference ? "Close photograph ×" : "View the original salon ↗"}</button>}
    </main>
    {!failed && active >= 3 && <div className="salon-look" aria-label={stop.piece !== undefined ? "Rotate the jewellery" : "Look around the salon"}>
      <div><button onClick={() => rotate(-Math.PI / 4)} disabled={travelling} aria-label="Turn left">←</button><button disabled={travelling} onClick={() => { setExplore(!explore); resetLook(); }} aria-pressed={explore}>{explore ? "Exit 360°" : stop.piece !== undefined ? "Rotate 360°" : "Look around 360°"}</button><button onClick={() => rotate(Math.PI / 4)} disabled={travelling} aria-label="Turn right">→</button></div>
      {explore && <p>Drag to {stop.piece !== undefined ? "rotate the gold" : "look around"}<button onClick={resetLook}>Reset view</button></p>}
    </div>}
    <nav className="salon-chapters" aria-label="Journey stops">
      <p>THE JOURNEY<span>AT YOUR OWN PACE</span></p>
      {SALON_STOPS.map((item, index) => <button key={item.title} onClick={() => visit(index)} aria-label={item.title} aria-current={active === index ? "step" : undefined}><i>{String(index + 1).padStart(2, "0")}</i><span>{["Sylhet Plaza", "The arrival", "The doors", "Grand salon", "The pendant", "The necklace", "Golden drops", "Private viewing"][index]}</span><b /></button>)}
    </nav>
    {reference && <aside className="salon-reference" id="salon-reference" aria-label="Original salon photograph"><button onClick={() => setReference(false)} aria-label="Close photograph">×</button><Image src={photoUrl(stop.photo)} width={480} height={360} alt="The supplied Jhuma salon photograph used as the design reference" unoptimized /><p>The original salon · Jhuma Jewellers</p></aside>}
    <div className="salon-transit" aria-hidden="true"><span />Follow the light.</div>
    <footer className="salon-footer">
      <span className="salon-footer-brand">JHUMA JEWELLERS <i>/</i> {String(active + 1).padStart(2, "0")}</span>
      <div className="salon-controls"><button onClick={() => visit(active - 1)} disabled={active === 0} aria-label="Previous view">↑</button><span>{String(active + 1).padStart(2, "0")} <i>/ {SALON_STOPS.length}</i></span><button onClick={() => visit(active === SALON_LAST ? 0 : active + 1)} aria-label={active === SALON_LAST ? "Restart from Sylhet Plaza" : "Next view"}>{active === SALON_LAST ? "↺" : "↓"}</button></div>
      <button className="salon-scroll-hint" onClick={() => visit(active === SALON_LAST ? 0 : active + 1)}>{active === SALON_LAST ? "Experience it again" : "Scroll to the next discovery"} <span>↓</span></button>
    </footer>
    <div className="salon-progress" aria-hidden="true" />
    {!ready && <p className="salon-loading" role="status">Preparing your private viewing…</p>}
    <p className="sr-only" aria-live="polite">{travelling ? "Moving to " : ""}{stop.title}. {stop.line}</p>
    {failed && <p className="salon-fallback" role="status">Showing the photographs. Use the arrows to explore the salon.</p>}
    <noscript><div className="salon-no-script">Explore Jhuma Jewellers. <Link href="/jewellery">View the jewellery →</Link></div></noscript>
  </div>;
}

class StageBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
