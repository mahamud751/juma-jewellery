"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { DOOR_STOP, JOURNEY_STEP, LAST_STOP, MALL, PIECES, STOPS, photoUrl, smooth } from "@/lib/journey";
import type { Spin } from "./showcase";
import type { MallLook } from "./mall-passage";
import "@/app/journey.css";

const JourneyStage = dynamic(() => import("./journey-stage"), { ssr: false });

export function JourneyExperience() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const spin = useRef<Spin>({ angle: 0, velocity: 0 });
  const mallLook = useRef<MallLook>({ yaw: 0, pitch: 0 });
  const [looking, setLooking] = useState(false);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const stop = STOPS[active];
  const piece = stop.piece === undefined ? undefined : PIECES[stop.piece];

  const fail = useCallback(() => { setFailed(true); setReady(true); }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onLoad = useCallback((count: number, total: number) => setLoaded(Math.round(count / total * 100)), []);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduced(media.matches);
    preference();
    media.addEventListener("change", preference);
    let frame = 0;
    const sync = () => {
      frame = 0;
      const element = root.current;
      if (!element) return;
      const travel = Math.max(1, element.offsetHeight - innerHeight);
      const p = Math.min(LAST_STOP, Math.max(0, scrollY / travel * LAST_STOP));
      progress.current = p;
      if (p < .8 || p > 1.4) {
        mallLook.current = { yaw: 0, pitch: 0 };
        setLooking(false);
      }
      setActive(Math.round(p));
      element.style.setProperty("--journey", String(p / LAST_STOP));
      element.querySelectorAll<HTMLElement>(".jr-copy").forEach((panel, index) => {
        const distance = p - index;
        const shown = 1 - smooth(.16, .4, Math.abs(distance));
        panel.style.opacity = String(shown);
        panel.style.transform = media.matches ? "" : `translateY(${-distance * 46}px)`;
        panel.inert = shown < .5;
        panel.setAttribute("aria-hidden", String(shown < .5));
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    sync();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", preference);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const visit = useCallback((index: number) => {
    const element = root.current;
    if (!element) return;
    const target = Math.max(0, Math.min(LAST_STOP, index));
    const travel = element.offsetHeight - innerHeight;
    window.scrollTo({ top: target / LAST_STOP * travel, behavior: reduced ? "instant" : "smooth" });
  }, [reduced]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select")) return;
      if (event.key === "Escape") { setLooking(false); mallLook.current = { yaw: 0, pitch: 0 }; }
      if (Math.abs(progress.current - MALL.stop) < .25 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        setLooking(true);
        mallLook.current.yaw += event.key === "ArrowLeft" ? -.3 : .3;
        return;
      }
      if (STOPS[Math.round(progress.current)].piece === undefined) return;
      if (event.key === "ArrowLeft") spin.current.velocity -= 3.2;
      if (event.key === "ArrowRight") spin.current.velocity += 3.2;
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  // Drag sideways on a creation to turn it; vertical drags still scroll the page.
  const drag = useRef<{ id: number; x: number; y: number; t: number } | null>(null);

  return <div ref={root} className="jr" data-ready={ready} data-piece={Boolean(piece)} data-looking={looking} data-stop={active} style={{ height: `${100 + LAST_STOP * JOURNEY_STEP * 100}svh` }}>
    {STOPS.map((_, index) => <div key={index} className="jr-snap" aria-hidden="true" style={{ top: `${index * JOURNEY_STEP * 100}svh` }} />)}
    <div className="jr-stage" aria-hidden="true"
      onPointerDown={(event) => {
        if ((!piece && !looking) || event.button !== 0) return;
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now() };
        event.currentTarget.setPointerCapture(event.pointerId);
        spin.current.velocity = 0;
      }}
      onPointerMove={(event) => {
        const last = drag.current;
        if (!last || last.id !== event.pointerId) return;
        const now = performance.now();
        if (looking) {
          mallLook.current.yaw -= (event.clientX - last.x) * .008;
          mallLook.current.pitch = Math.max(-.65, Math.min(.65, mallLook.current.pitch + (event.clientY - last.y) * .005));
          last.x = event.clientX; last.y = event.clientY;
          return;
        }
        const turn = (event.clientX - last.x) * .011;
        spin.current.angle += turn;
        spin.current.velocity = turn / Math.max(.008, (now - last.t) / 1000);
        last.x = event.clientX; last.t = now;
      }}
      onPointerUp={(event) => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { drag.current = null; }}>
      {failed
        ? <div className="jr-fallback" style={{ backgroundImage: `url(${photoUrl(stop.photo)})` }} />
        : <StageBoundary onError={fail}><JourneyStage progress={progress} spin={spin} mallLook={mallLook} reduced={reduced} onLoad={onLoad} onReady={onReady} onFailure={fail} /></StageBoundary>}
      <div className="jr-vignette" />
    </div>

    <header className="jr-header">
      <button className="jr-brand" onClick={() => visit(0)} aria-label="Back to Sylhet Plaza">JHUMA<span>J E W E L L E R S</span></button>
      <span className="jr-where"><i />{stop.label}</span>
      <nav aria-label="Main navigation"><Link href="/collections">Collections</Link><Link href="/appointment" className="jr-cta-small">Private viewing ↗</Link></nav>
    </header>

    <main className="jr-stories">
      {STOPS.map((item, index) => {
        const creation = item.piece === undefined ? undefined : PIECES[item.piece];
        return <section key={item.label} className={`jr-copy${creation ? " jr-copy-piece" : ""}`} style={{ opacity: index ? 0 : 1 }} aria-hidden={index !== 0} inert={index !== 0}>
          <p className="jr-kicker">{item.kicker}</p>
          {index === 0 ? <h1>{item.title.split("\n").map((line, i) => <span key={i}>{line}</span>)}</h1>
            : <h2>{item.title.split("\n").map((line, i) => <span key={i}>{line}</span>)}</h2>}
          {creation && <p className="jr-bengali" lang="bn">{creation.bengali}</p>}
          <p className="jr-line">{item.line}</p>
          {creation && <ul className="jr-details">{creation.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
          {index === 0 && <button className="jr-button" onClick={() => visit(1)}>Begin the walk <span>↓</span></button>}
          {index === MALL.stop && <button className="jr-button" onClick={() => visit(MALL.stop + 1)}>Continue through the plaza <span>↓</span></button>}
          {index === DOOR_STOP && <button className="jr-button" onClick={() => visit(DOOR_STOP + 1)}>Open the doors <span>↓</span></button>}
          {creation && <div className="jr-piece-actions">
            <span className="jr-drag"><b>⟲</b> Drag to turn 360°</span>
            <Link href="/appointment" className="jr-link">Ask to see this piece ↗</Link>
          </div>}
          {index === LAST_STOP && <div className="jr-piece-actions">
            <Link href="/appointment" className="jr-button">Book a private viewing <span>↗</span></Link>
            <Link href="/collections" className="jr-link">Browse the collection</Link>
          </div>}
        </section>;
      })}
    </main>

    {active === MALL.stop && !failed && <div className="jr-look" aria-label="Explore the mall in 360 degrees">
      <div><button aria-label="Look left" onClick={() => { setLooking(true); mallLook.current.yaw -= Math.PI / 4; }}>←</button>
      <button aria-pressed={looking} onClick={() => { setLooking(!looking); mallLook.current = { yaw: 0, pitch: 0 }; }}>{looking ? "Finish looking" : "Look around 360°"}</button>
      <button aria-label="Look right" onClick={() => { setLooking(true); mallLook.current.yaw += Math.PI / 4; }}>→</button></div>
      {looking && <p>Drag to look around · Finish to keep walking<button onClick={() => { mallLook.current = { yaw: 0, pitch: 0 }; }}>Centre view</button></p>}
    </div>}

    <nav className="jr-rail" aria-label="Journey stops">
      {STOPS.map((item, index) => <button key={item.label} onClick={() => visit(index)} aria-label={item.label} aria-current={active === index ? "step" : undefined} data-piece={item.piece !== undefined}>
        <span>{item.label}</span><i />
      </button>)}
    </nav>

    <footer className="jr-footer">
      <span className="jr-count">{String(active + 1).padStart(2, "0")}<i> / {String(STOPS.length).padStart(2, "0")}</i></span>
      <button className="jr-next" onClick={() => visit(active === LAST_STOP ? 0 : active + 1)}>
        {active === LAST_STOP ? "Walk it again" : active === 0 ? "Scroll to begin" : piece ? "Scroll for the next creation" : "Scroll to keep walking"}
        <span>{active === LAST_STOP ? "↺" : "↓"}</span>
      </button>
    </footer>
    <div className="jr-progress" aria-hidden="true" />

    <div className="jr-loader" aria-hidden={ready} role="status">
      <p>JHUMA<span>J E W E L L E R S</span></p>
      <div><i style={{ transform: `scaleX(${Math.max(.08, loaded / 100)})` }} /></div>
      <small>Opening the salon…</small>
    </div>
    <p className="sr-only" aria-live="polite">{stop.label}. {piece ? `${piece.name}.` : ""}</p>
    {failed && <p className="jr-fallback-note" role="status">3D is unavailable on this device. Showing the salon photographs.</p>}
  </div>;
}

class StageBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
