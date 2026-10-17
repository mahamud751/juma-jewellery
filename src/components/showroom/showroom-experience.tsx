"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { photoUrl } from "@/lib/journey";
import { CHAPTERS, CHAPTER_COUNT, travelSeconds } from "@/lib/showroom";
import "@/app/journey.css";
import "@/app/showroom.css";

const Stage = dynamic(() => import("./showroom-stage"), { ssr: false });

type Props = {
  /** The chapter the hall opens on. */
  startAt?: number;
  /** Rail labels for the steps before the hall (the walk), and where they lead. */
  before?: string[];
  onBack?: (stop: number) => void;
  onRestart?: () => void;
  /** Steps before the hall and in the whole home page, for the counter. */
  offset?: number;
  total?: number;
};

/**
 * The hall, in the walk's own design. One scroll is one chapter: the copy leaves, the camera
 * flies to the next case (scrolling stays locked for the flight), the case opens, and the new
 * copy lands on the side away from the piece.
 */
export function ShowroomExperience({ startAt = 0, before = [], onBack, onRestart, offset = 0, total = CHAPTER_COUNT }: Props) {
  const [section, setSection] = useState(startAt);
  /** The chapter whose copy is on screen: -1 while the camera is still flying. */
  const [shown, setShown] = useState(-1);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(6);
  const [reduced, setReduced] = useState(false);
  const [fancy, setFancy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);

  const sectionRef = useRef(startAt);
  const menuRef = useRef(false);
  const enteredRef = useRef(false);
  const lockRef = useRef(false);
  const arriveRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const onProgress = useCallback((value: number) => setProgress((current) => Math.max(current, value)), []);

  const go = useCallback((next: number) => {
    if (!enteredRef.current || lockRef.current) return;
    if (next < 0 && onBack) {
      onBack(before.length - 1);
      return;
    }
    const clamped = Math.min(CHAPTER_COUNT - 1, Math.max(0, next));
    if (clamped === sectionRef.current) return;
    const flight = reduced ? 0 : travelSeconds(sectionRef.current, clamped) * 1000;
    sectionRef.current = clamped;
    setSection(clamped);
    setShown(-1);
    lockRef.current = true;
    window.clearTimeout(arriveRef.current);
    arriveRef.current = window.setTimeout(() => setShown(clamped), flight * 0.78);
    window.setTimeout(() => { lockRef.current = false; }, flight);
  }, [reduced, onBack, before.length]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 900px)");
    const sync = () => {
      const hints = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
      const constrained = hints.connection?.saveData === true || (hints.deviceMemory !== undefined && hints.deviceMemory < 8) || (navigator.hardwareConcurrency || 4) < 8;
      setReduced(reduce.matches);
      setFancy(wide.matches && !reduce.matches && !constrained);
    };
    sync();
    reduce.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    const minTime = window.setTimeout(() => setProgress((value) => Math.max(value, 100)), 1800);
    const giveUp = window.setTimeout(() => setProgress(100), 7000);
    const onHide = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      reduce.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onHide);
      window.clearTimeout(minTime);
      window.clearTimeout(giveUp);
    };
  }, []);

  // Open once loaded: the loader fades, then the first copy lands.
  useEffect(() => {
    if (ready || progress < 99) return;
    const timer = window.setTimeout(() => {
      setReady(true);
      window.setTimeout(() => {
        enteredRef.current = true;
        setShown(sectionRef.current);
      }, reduced ? 100 : 700);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [progress, ready, reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Trackpads keep firing a fading tail of small wheel events after a push; those are ignored
    // until the gesture pauses or pushes harder, so one swipe is one chapter.
    let lastWheel = 0;
    let lastAbs = 0;
    let gathered = 0;
    let spent = false;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (!enteredRef.current) return;
      const now = performance.now();
      const abs = Math.abs(event.deltaY);
      if (now - lastWheel > 180 || (spent && abs > lastAbs * 1.6 && abs > 12)) {
        spent = false;
        gathered = 0;
      }
      lastWheel = now;
      lastAbs = abs;
      if (lockRef.current || (spent && abs < 50)) return;
      gathered += event.deltaY;
      if (Math.abs(gathered) < 24) return;
      go(sectionRef.current + Math.sign(gathered));
      gathered = 0;
      spent = true;
    };
    let startY = 0;
    const onTouchStart = (event: TouchEvent) => { startY = event.touches[0]?.clientY ?? 0; };
    const onTouchEnd = (event: TouchEvent) => {
      const delta = startY - (event.changedTouches[0]?.clientY ?? startY);
      if (Math.abs(delta) >= 42) go(sectionRef.current + Math.sign(delta));
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        go(sectionRef.current + 1);
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        go(sectionRef.current - 1);
      } else if (event.key === "End") {
        event.preventDefault();
        go(CHAPTER_COUNT - 1);
      }
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [go]);

  const chapter = CHAPTERS[section];
  const last = CHAPTER_COUNT - 1;
  const right = chapter.place === "r";
  const step = offset + section;

  return (
    <div ref={rootRef} className={`experience showroom-jr${right ? " is-right" : ""}`} data-ready={ready}>
      <div className="stage-wrap" aria-hidden="true">
        {failed ? <div className="jr-fallback" style={{ backgroundImage: `url(${photoUrl(38)})` }} /> : (
          <StageBoundary onError={() => setFailed(true)}>
            <Stage sectionRef={sectionRef} menuRef={menuRef} fancy={fancy} reduced={reduced} paused={paused} onProgress={onProgress} initial={startAt} />
          </StageBoundary>
        )}
      </div>
      <div className="jr-vignette sh-vignette" aria-hidden="true" />

      <header className="jr-header">
        <button className="jr-brand" onClick={() => (onRestart ? onRestart() : go(0))} aria-label="Back to Sylhet Plaza">JHUMA<span>J E W E L L E R S</span></button>
        <span className="jr-where"><i />{chapter.name}</span>
        <nav aria-label="Main navigation"><Link href="/collections">Collections</Link><Link href="/appointment" className="jr-cta-small">Private viewing ↗</Link></nav>
      </header>

      <main className="jr-stories">
        {CHAPTERS.map((item, index) => {
          const on = shown === index;
          const [first, second] = item.title.split("\n");
          return (
            <section key={item.id} className={`jr-copy sh-copy${item.bengali ? " jr-copy-piece" : ""}${item.place === "r" ? " is-right" : ""}${on ? " is-on" : ""}`} aria-hidden={!on} inert={!on}>
              <p className="jr-kicker">{item.eyebrow}</p>
              <h2><span>{first}</span><span>{second}</span></h2>
              {item.bengali && <p className="jr-bengali" lang="bn">{item.bengali}</p>}
              <p className="jr-line">{item.desc}</p>
              {item.details && <ul className="jr-details">{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
              {index === 0 ? (
                <button className="jr-button" onClick={() => go(1)}>{item.highlight} <span>↓</span></button>
              ) : index === last ? (
                <div className="jr-piece-actions">
                  <Link href="/appointment" className="jr-button">{item.highlight} <span>↗</span></Link>
                  <Link href="/collections" className="jr-link">Browse the collection</Link>
                </div>
              ) : (
                <div className="jr-piece-actions">
                  <Link href={item.href ?? "/collections"} className="jr-button">{item.highlight} <span>↗</span></Link>
                  <Link href="/appointment" className="jr-link">Ask to see this piece ↗</Link>
                </div>
              )}
            </section>
          );
        })}
      </main>

      <nav className="jr-rail" aria-label="Steps">
        {before.map((label, index) => (
          <button key={`w${label}`} onClick={() => onBack?.(index)} aria-label={label}><span>{label}</span><i /></button>
        ))}
        {CHAPTERS.map((item, index) => (
          <button key={item.id} onClick={() => go(index)} aria-label={item.name} aria-current={section === index ? "step" : undefined} data-piece={Boolean(item.bengali)}>
            <span>{item.name}</span><i />
          </button>
        ))}
      </nav>

      <footer className="jr-footer">
        <span className="jr-count">{String(step + 1).padStart(2, "0")}<i> / {String(total).padStart(2, "0")}</i></span>
        <button className="jr-next" onClick={() => (section === last ? (onRestart ? onRestart() : go(0)) : go(section + 1))}>
          {section === last ? "Walk it again" : section === 0 ? "Scroll to open the first case" : "Scroll to open the next case"}
          <span>{section === last ? "↺" : "↓"}</span>
        </button>
      </footer>
      <div className="jr-progress" aria-hidden="true" style={{ ["--journey" as string]: String(step / Math.max(1, total - 1)) }} />

      <div className="jr-loader" aria-hidden={ready} role="status">
        <p>JHUMA<span>J E W E L L E R S</span></p>
        <div><i style={{ transform: `scaleX(${Math.max(0.08, Math.min(100, progress) / 100)})` }} /></div>
        <small>Opening the hall…</small>
      </div>
      <p className="sr-only" aria-live="polite">{chapter.name}.</p>
    </div>
  );
}

class StageBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
