"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { HOUSE, type Piece } from "@/lib/catalog";
import { CONTACT, PLAN_ZONES, SCENES, hotspotPiece, sceneIndex, type Hotspot } from "@/lib/tour";
import "@/app/tour.css";

const PanoView = dynamic(() => import("@/components/tour/pano-view"), { ssr: false });
const SIZES = "(max-aspect-ratio: 4/3) 142vh, 106vw";
const LEAVE_MS = 2400;

type Leaving = { index: number; origin: string; key: number };

export function ShopTour({ bengaliFont }: { bengaliFont: string }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<Leaving | null>(null);
  const [walk, setWalk] = useState<{ src: string; to: number; origin: string; ending?: boolean } | null>(null);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [film, setFilm] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [lite, setLite] = useState(false);
  const indexRef = useRef(0);
  const startedRef = useRef(false);
  const scene = SCENES[index];
  useEffect(() => { startedRef.current = started; }, [started]);

  // A shared link opens at its spot: /#rings goes straight to the ring counter.
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    // Reading browser-only settings once after mount; the server render has no access to them.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLite(reduced || saveData);
    const initial = sceneIndex(location.hash.slice(1));
    if (initial > 0) { indexRef.current = initial; setIndex(initial); setStarted(true); }
  }, []);

  const closePanels = useCallback(() => { setPiece(null); setFilm(null); setNote(null); setPlanOpen(false); }, []);

  const commit = useCallback((to: number, origin = "50% 50%") => {
    const from = indexRef.current;
    if (to === from || to < 0) return;
    indexRef.current = to;
    setLeaving({ index: from, origin, key: Date.now() });
    setIndex(to);
    setWalk(null);
    history.replaceState(null, "", `#${SCENES[to].id}`);
  }, []);

  /** The walking film has reached the next spot: show it underneath and let the film fade away over it. */
  const arrive = useCallback((to: number) => {
    indexRef.current = to;
    setIndex(to);
    setWalk((current) => current && { ...current, ending: true });
    history.replaceState(null, "", `#${SCENES[to].id}`);
  }, []);

  useEffect(() => {
    if (!walk?.ending) return;
    const timer = setTimeout(() => setWalk(null), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [walk]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setLeaving(null), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  const goTo = useCallback((to: number, origin?: string, walkFilm?: string) => {
    closePanels();
    setStarted(true);
    if (walkFilm && !lite) setWalk({ src: walkFilm, to, origin: origin ?? "50% 50%" });
    else commit(to, origin);
  }, [closePanels, commit, lite]);

  const activate = useCallback((spot: Hotspot) => {
    // Walk straight ahead at eye level: head toward the spot left or right, but not down to the floor where most dots sit.
    if ("go" in spot) goTo(sceneIndex(spot.go), `${spot.x}% ${Math.min(55, Math.max(35, spot.y))}%`, spot.walk);
    else if ("note" in spot) { closePanels(); setNote(spot.note); }
    else { closePanels(); setPiece(hotspotPiece(spot) ?? null); }
  }, [goTo, closePanels]);

  // Following a link to another spot (#rings) while already on the page walks there.
  useEffect(() => {
    const onHash = () => { const to = sceneIndex(location.hash.slice(1)); if (to >= 0) goTo(to); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [goTo]);

  /** One spot forward or back along the walk. Forward uses the walking film where the photos have one. */
  const step = useCallback((direction: 1 | -1) => {
    const from = indexRef.current;
    const to = from + direction;
    if (to < 0 || to >= SCENES.length) return;
    const path = direction > 0 ? SCENES[from].hotspots.find((spot) => "go" in spot && spot.go === SCENES[to].id) : undefined;
    if (path) activate(path);
    else goTo(to);
  }, [activate, goTo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanels();
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea")) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") step(1);
      if (event.key === "ArrowLeft" || event.key === "PageUp") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePanels, step]);

  // The mouse wheel walks: scroll down for the next spot, up for the one before.
  // A trackpad sends a long burst of events per swipe, so each burst moves one spot only.
  const walking = useRef(false);
  useEffect(() => { walking.current = Boolean(walk); }, [walk]);
  const filmRunning = Boolean(walk && !walk.ending);
  useEffect(() => {
    let total = 0;
    let lastEvent = 0;
    let lastMove = 0;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return; // pinch-zoom
      if (event.target instanceof Element && event.target.closest(".tour-sheet, .tour-film, .tour-plan")) return;
      if (document.querySelector(".tour-sheet-backdrop, .tour-film") || walking.current) return;
      const now = performance.now();
      const quiet = now - lastEvent > 220;
      lastEvent = now;
      if (quiet) total = 0;
      // Let each slow walk finish (and the swipe's inertia tail die out) before taking another step.
      if (now - lastMove < LEAVE_MS) return;
      total += Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : 0;
      if (Math.abs(total) < 40) return;
      lastMove = now;
      total = 0;
      if (!startedRef.current) { goTo(0); return; }
      step(event.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [goTo, step]);

  const next = index + 1 < SCENES.length ? index + 1 : -1;
  const preload = [...new Set([next, ...scene.hotspots.flatMap((spot) => ("go" in spot ? [sceneIndex(spot.go)] : []))])].filter((i) => i >= 0 && i !== index);
  const renderSpot = (spot: Hotspot) => <SpotButton spot={spot} onActivate={activate} />;

  return (
    <div className={`tour ${bengaliFont}`} data-area={scene.area} data-started={started || undefined} data-walking={filmRunning ? "" : undefined}>
      <div className="tour-view" aria-hidden={piece || film ? true : undefined}>
        {leaving && <SceneFrame key={`leave-${leaving.key}`} index={leaving.index} leaving origin={leaving.origin} lite={lite} />}
        {scene.pano
          ? <PanoView key={scene.id} src={scene.pano} hotspots={scene.hotspots} renderSpot={renderSpot} />
          : <SceneFrame key={scene.id} index={index} arriving={Boolean(leaving || walk?.ending)} lite={lite} renderSpot={renderSpot} />}
        {walk && <WalkFilm key={walk.src} src={walk.src} ending={walk.ending} onDone={() => arrive(walk.to)} />}
        <div className="tour-preload" aria-hidden="true">
          {preload.map((i) => <Image key={SCENES[i].id} src={SCENES[i].photo} alt="" fill sizes={SIZES} loading="eager" />)}
          {/* Fetch the walking films from this spot ahead of the tap, so they start at once. */}
          {!lite && scene.hotspots.map((spot) => "walk" in spot && spot.walk && <video key={spot.walk} src={spot.walk} muted playsInline preload="auto" />)}
        </div>
      </div>
      <div className="tour-shade" aria-hidden="true" />

      <header className="tour-header">
        <Link href="/" className="tour-brand" aria-label={`${HOUSE.name} home`}>JHUMA<span>JEWELLERS · SYLHET</span></Link>
        <nav aria-label="Main navigation">
          <Link href="/jewellery">All jewellery</Link>
          <Link href="/appointment" className="tour-cta">Book a visit</Link>
        </nav>
      </header>

      {started && <section className="tour-caption" key={scene.id} aria-live="polite">
        <p className="tour-kicker">{String(index + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")} · {scene.kicker}</p>
        <h1>{scene.name}<span lang="bn">{scene.bengali}</span></h1>
        <p className="tour-line">{scene.line}</p>
        <div className="tour-caption-actions">
          {scene.film && <button onClick={() => { closePanels(); setFilm(scene.film!); }}>▶ Watch the film</button>}
          {scene.id === "visit" && <>
            {CONTACT.whatsapp && <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp us</a>}
            <Link href="/appointment">Book a visit</Link>
            <a href={CONTACT.maps} target="_blank" rel="noreferrer">Directions</a>
          </>}
        </div>
        {scene.hotspots.length > 0 && <div className="tour-chips" role="list" aria-label="In this spot">
          {scene.hotspots.map((spot) => <button role="listitem" key={spot.label} className={"go" in spot ? "is-go" : "piece" in spot ? "is-piece" : ""} onClick={() => activate(spot)}>
            {"go" in spot ? "→ " : "piece" in spot ? "◆ " : "i "}{spot.label}
          </button>)}
        </div>}
        <p className="tour-hint"><span className="tour-hint-mouse">Scroll to walk · </span>{scene.pano ? "Drag to look around" : <><span className="tour-hint-touch">Drag to look around · </span>Tap the gold dots</>}</p>
      </section>}

      {!started && <section className="tour-intro">
        <p className="tour-kicker">{HOUSE.address}</p>
        <h1>Visit the shop<br /><em>from home.</em></h1>
        <p className="tour-intro-bn" lang="bn">ঘরে বসেই ঘুরে দেখুন ঝুমা জুয়েলার্স</p>
        <p className="tour-line">Walk in from Zindabazar road, step through the door, and look at every display the way you would in person. Tap any piece to see it close.</p>
        <div className="tour-intro-actions">
          <button className="tour-primary" onClick={() => goTo(0)}>Start the walk <span>→</span></button>
          <button className="tour-secondary" onClick={() => goTo(sceneIndex("inside"), "45% 62%")}>Go straight inside</button>
        </div>
      </section>}

      <button className="tour-plan-toggle" onClick={() => setPlanOpen((open) => !open)} aria-expanded={planOpen} aria-controls="tour-plan">{planOpen ? "Close ×" : "Shop map"}</button>
      <nav id="tour-plan" className="tour-plan" data-open={planOpen} aria-label="Shop map">
        <p className="tour-kicker">The shop · Fourth floor</p>
        <svg viewBox="0 0 100 86" role="img" aria-label="Map of the one-room shop: necklace hall on the back wall, logo wall on the left, showroom wall on the right, door at the front">
          <path className="tour-plan-wall" d="M4 4h92v74H58M42 78H4V4" />
          {PLAN_ZONES.map((zone) => <path key={zone.id} d={zone.d} className={scene.id === zone.id ? "is-here" : ""} onClick={() => goTo(sceneIndex(zone.id))} />)}
          {PLAN_ZONES.map((zone) => {
            const [x, y] = zone.d.slice(1).split(/[hv]/)[0].split(" ").map(Number);
            return <text key={zone.id} x={x + 1} y={y - 1.5}>{zone.label}</text>;
          })}
          <text x="50" y="84" textAnchor="middle">Door</text>
          {scene.area === "outside" && <circle cx="50" cy="82" r="1.8" className="tour-plan-you" />}
          {scene.id === "inside" && <circle cx="50" cy="70" r="1.8" className="tour-plan-you" />}
        </svg>
        <div className="tour-plan-list">
          {SCENES.map((item, i) => <button key={item.id} onClick={() => goTo(i)} aria-current={i === index ? "location" : undefined}><span>{String(i + 1).padStart(2, "0")}</span>{item.name}</button>)}
        </div>
      </nav>

      <footer className="tour-footer">
        <button onClick={() => step(-1)} disabled={index === 0} aria-label="Previous spot">←</button>
        <ol className="tour-steps" aria-label="The walk">
          {SCENES.map((item, i) => <li key={item.id}><button onClick={() => goTo(i)} aria-label={item.name} aria-current={i === index ? "step" : undefined} data-area={item.area} /></li>)}
        </ol>
        <button className="tour-next" onClick={() => (next >= 0 ? step(1) : goTo(0))}>
          {next >= 0 ? <><span className="tour-next-name">Next: {SCENES[next].name}</span><span className="tour-next-short">Next</span> <span>→</span></> : <>Walk again <span>↺</span></>}
        </button>
      </footer>

      {piece && <PieceSheet piece={piece} onClose={() => setPiece(null)} />}
      {film && <div className="tour-film" role="dialog" aria-modal="true" aria-label={`${scene.name}, film`}>
        <video src={film} poster={scene.photo} autoPlay muted loop playsInline controls />
        <button className="tour-close" onClick={() => setFilm(null)} aria-label="Close film">×</button>
      </div>}
      {note && <div className="tour-note" role="status"><p>{note}</p><button onClick={() => setNote(null)} aria-label="Close">×</button></div>}
    </div>
  );
}

function SpotButton({ spot, onActivate }: { spot: Hotspot; onActivate: (spot: Hotspot) => void }) {
  const kind = "go" in spot ? "go" : "piece" in spot ? "piece" : "note";
  return <button className={`tour-spot is-${kind}`} data-flip={spot.x > 70 ? "" : undefined} onClick={(event) => {
    if (event.currentTarget.closest("[data-dragged='true']")) return;
    onActivate(spot);
  }}>
    <span className="tour-spot-dot">{kind === "go" ? "→" : kind === "note" ? "i" : ""}</span>
    <span className="tour-spot-label">{spot.label}</span>
  </button>;
}

/**
 * One photograph, sized to cover the screen with a little spare on every side so it can be panned.
 * Hotspots live inside the frame, so they stay pinned to the jewellery while it moves.
 */
function SceneFrame({ index, leaving, arriving, origin, lite, renderSpot }: { index: number; leaving?: boolean; arriving?: boolean; origin?: string; lite: boolean; renderSpot?: (spot: Hotspot) => React.ReactNode }) {
  const scene = SCENES[index];
  const view = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const pan = useRef({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);

  const range = () => {
    const box = frame.current?.getBoundingClientRect();
    return box ? { x: Math.max(0, (box.width - innerWidth) / 2), y: Math.max(0, (box.height - innerHeight) / 2) } : { x: 0, y: 0 };
  };
  const apply = (x: number, y: number) => {
    const { x: rx, y: ry } = range();
    pan.current = { x: Math.max(-rx, Math.min(rx, x)), y: Math.max(-ry, Math.min(ry, y)) };
    frame.current?.style.setProperty("--px", `${pan.current.x}px`);
    frame.current?.style.setProperty("--py", `${pan.current.y}px`);
  };

  // On a narrow screen much of the photo is off to the sides, so open looking at the first hotspot.
  useEffect(() => {
    if (leaving) return;
    const spot = scene.hotspots[0];
    const box = frame.current?.getBoundingClientRect();
    if (!spot || !box || box.width < innerWidth * 1.3) return;
    apply((.5 - spot.x / 100) * box.width, 0);
    // Pan is imperative (CSS variables) and only needs the mounted frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving, scene]);

  if (leaving) {
    return <div className="tour-frame-wrap is-leaving" data-lite={lite || undefined}>
      <div className="tour-frame" style={{ transformOrigin: origin }}>
        <Image src={scene.photo} alt="" fill sizes={SIZES} />
      </div>
    </div>;
  }

  const onPointerDown = (event: ReactPointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.current.x, panY: pan.current.y, moved: false };
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    const active = drag.current;
    if (active && (event.pointerType !== "mouse" || event.buttons)) {
      const dx = event.clientX - active.x;
      const dy = event.clientY - active.y;
      if (!active.moved && Math.hypot(dx, dy) > 6) {
        active.moved = true;
        view.current?.setAttribute("data-dragged", "true");
        view.current?.setAttribute("data-dragging", "true");
      }
      if (active.moved) apply(active.panX + dx, active.panY + dy);
      return;
    }
    // With a mouse, the view drifts toward the cursor like turning your head.
    if (event.pointerType === "mouse" && !lite) {
      const { x: rx, y: ry } = range();
      apply(-((event.clientX / innerWidth) * 2 - 1) * rx, -((event.clientY / innerHeight) * 2 - 1) * ry);
    }
  };
  const onPointerUp = () => {
    drag.current = null;
    view.current?.removeAttribute("data-dragging");
    // Let the click that ends a drag see the flag, then clear it.
    setTimeout(() => view.current?.removeAttribute("data-dragged"), 0);
  };

  return <div ref={view} className={`tour-frame-wrap${arriving ? " is-arriving" : ""}`} data-lite={lite || undefined}
    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
    <div ref={frame} className="tour-frame">
      <Image src={scene.photo} alt={scene.alt} fill sizes={SIZES} preload={index === 0} draggable={false} />
      {renderSpot && scene.hotspots.map((spot) => <div key={spot.label} className="tour-spot-anchor" style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>{renderSpot(spot)}</div>)}
    </div>
  </div>;
}

/** Plays the whole walking film between two spots, then fades away over the next one. If it cannot start, the walk just cuts. */
function WalkFilm({ src, ending, onDone }: { src: string; ending?: boolean; onDone: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    const element = video.current;
    let finished = false;
    const finish = () => { if (!finished) { finished = true; done.current(); } };
    const giveUp = setTimeout(() => { if (!element || element.paused) finish(); }, 3000);
    const onPlaying = () => { setPlaying(true); clearTimeout(giveUp); };
    element?.addEventListener("playing", onPlaying, { once: true });
    element?.addEventListener("ended", finish, { once: true });
    element?.play().catch(finish);
    return () => { clearTimeout(giveUp); element?.removeEventListener("playing", onPlaying); element?.removeEventListener("ended", finish); };
  }, []);
  return <div className="tour-walk" data-playing={playing || undefined} data-ending={ending || undefined}>
    <video ref={video} src={src} muted playsInline preload="auto" />
    {!ending && <button className="tour-walk-skip" onClick={() => done.current()}>Skip →</button>}
  </div>;
}

function PieceSheet({ piece, onClose }: { piece: Piece; onClose: () => void }) {
  const [zoom, setZoom] = useState<string | null>(null);
  const ask = CONTACT.whatsapp
    ? `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`Hi Jhuma Jewellers, I saw "${piece.name}" in the online shop tour. Could you tell me the weight and today's price?`)}`
    : null;
  return <div className="tour-sheet-backdrop" onClick={onClose}>
    <aside className="tour-sheet" role="dialog" aria-modal="true" aria-label={piece.name} onClick={(event) => event.stopPropagation()}>
      <button className="tour-close" onClick={onClose} aria-label="Back to the shop">×</button>
      <div className="tour-sheet-media" data-zoom={zoom ? "" : undefined}
        onClick={(event) => {
          if (piece.kind === "film") return;
          const box = event.currentTarget.getBoundingClientRect();
          setZoom(zoom ? null : `${((event.clientX - box.left) / box.width) * 100}% ${((event.clientY - box.top) / box.height) * 100}%`);
        }}
        onPointerMove={(event) => {
          if (!zoom || event.pointerType !== "mouse") return;
          const box = event.currentTarget.getBoundingClientRect();
          setZoom(`${((event.clientX - box.left) / box.width) * 100}% ${((event.clientY - box.top) / box.height) * 100}%`);
        }}>
        {piece.kind === "film"
          ? <video src={piece.src} poster={piece.poster} autoPlay muted loop playsInline />
          : <Image src={piece.poster} alt={piece.alt} fill sizes="(max-width: 800px) 100vw, 60vw" style={{ transformOrigin: zoom ?? "50% 50%" }} />}
        {piece.kind !== "film" && <span className="tour-zoom-hint">{zoom ? "Tap to zoom out" : "Tap to zoom in"}</span>}
      </div>
      <div className="tour-sheet-body">
        <p className="tour-kicker">{piece.category} · On display in the shop</p>
        <h2>{piece.name}</h2>
        <p>{piece.story}</p>
        <dl>
          <div><dt>Metal</dt><dd>Yellow gold</dd></div>
          <div><dt>Price</dt><dd>By weight, at today&apos;s gold rate</dd></div>
          <div><dt>Where</dt><dd>{HOUSE.short}</dd></div>
        </dl>
        <div className="tour-sheet-actions">
          {ask && <a className="tour-primary" href={ask} target="_blank" rel="noreferrer">Ask price on WhatsApp</a>}
          <Link className={ask ? "tour-secondary" : "tour-primary"} href="/appointment">Book a visit to try it on</Link>
          <Link className="tour-secondary" href={`/jewellery/${piece.slug}`}>Full details</Link>
        </div>
      </div>
    </aside>
  </div>;
}
