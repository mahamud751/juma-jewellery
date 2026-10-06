"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AudioWave } from "@/components/audio-wave";
import { Cursor } from "@/components/cursor";
import { LoaderCount, ScrollRail } from "@/components/experience";
import { Menu } from "@/components/site/menu";
import { SplitText } from "@/components/split-text";
import { CHAPTERS, CHAPTER_COUNT, travelSeconds } from "@/lib/showroom";
import { sound } from "@/lib/sound";
import "@/app/showroom.css";

const Stage = dynamic(() => import("./showroom-stage"), { ssr: false });

type Phase = "boot" | "cta" | "leaving" | "in";

/**
 * The salon, GRAIR-style: one scroll is one chapter. The copy leaves, the camera flies down the
 * hall to the next display (scrolling stays locked for the flight), the display opens, and the new
 * copy lands opposite the piece.
 */
type Props = {
  /** Arriving from the walk: no enter gate, the hall opens as soon as it has loaded. */
  skipIntro?: boolean;
  /** Scrolling up from the first chapter goes back to the walk. */
  onBack?: () => void;
  /** Steps before the hall and in the whole home page, for the counter. */
  offset?: number;
  total?: number;
};

export function ShowroomExperience({ skipIntro = false, onBack, offset = 0, total = CHAPTER_COUNT }: Props = {}) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [section, setSection] = useState(0);
  /** The chapter whose copy is on screen: -1 while the camera is still flying. */
  const [shown, setShown] = useState(0);
  const [menu, setMenu] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [progress, setProgress] = useState(8);
  const [reduced, setReduced] = useState(false);
  const [fancy, setFancy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [logoOn, setLogoOn] = useState(false);
  const [failed, setFailed] = useState(false);

  const sectionRef = useRef(0);
  const menuRef = useRef(false);
  const enteredRef = useRef(false);
  const lockRef = useRef(false);
  const arriveRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sectionRef.current = section;
    menuRef.current = menu;
    enteredRef.current = phase === "in";
  }, [section, menu, phase]);

  const onProgress = useCallback((value: number) => setProgress((current) => Math.max(current, value)), []);

  const go = useCallback((next: number) => {
    if (!enteredRef.current || menuRef.current || lockRef.current) return;
    if (next < 0 && onBack) {
      onBack();
      return;
    }
    const clamped = Math.min(CHAPTER_COUNT - 1, Math.max(0, next));
    if (clamped === sectionRef.current) return;
    const flight = reduced ? 0 : travelSeconds(sectionRef.current, clamped) * 1000;
    sectionRef.current = clamped;
    setSection(clamped);
    setShown(-1);
    lockRef.current = true;
    void sound.blip(0.35);
    window.clearTimeout(arriveRef.current);
    arriveRef.current = window.setTimeout(() => setShown(clamped), flight * 0.78);
    window.setTimeout(() => { lockRef.current = false; }, flight);
  }, [reduced, onBack]);

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
    const reveal = window.setTimeout(() => setLogoOn(true), 480);
    const minTime = window.setTimeout(() => setProgress((value) => Math.max(value, 100)), 2600);
    const giveUp = window.setTimeout(() => setProgress(100), 7000);
    const onHide = () => {
      setPaused(document.hidden);
      void sound.duck(document.hidden);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      reduce.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onHide);
      window.clearTimeout(reveal);
      window.clearTimeout(minTime);
      window.clearTimeout(giveUp);
    };
  }, []);

  useEffect(() => {
    if (phase === "boot" && progress >= 99) {
      const timer = window.setTimeout(() => {
        if (!skipIntro) return setPhase("cta");
        setPhase("leaving");
        window.setTimeout(() => {
          enteredRef.current = true;
          setPhase("in");
        }, reduced ? 200 : 1100);
      }, reduced ? 200 : 500);
      return () => window.clearTimeout(timer);
    }
  }, [phase, progress, reduced, skipIntro]);

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
      if (!enteredRef.current || menuRef.current) return;
      event.preventDefault();
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
      } else if (event.key === "Home") {
        event.preventDefault();
        go(0);
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

  const enter = () => {
    if (phase !== "cta") return;
    setPhase("leaving");
    void sound.blip(0.9);
    void sound.setMusic(true);
    setAudioOn(true);
    window.setTimeout(() => {
      enteredRef.current = true;
      setPhase("in");
    }, reduced ? 200 : 1100);
  };

  const toggleAudio = () => {
    const next = !audioOn;
    setAudioOn(next);
    void sound.setMusic(next);
    void sound.blip(0.3);
  };

  const toggleMenu = () => {
    if (phase !== "in") return;
    const next = !menu;
    menuRef.current = next;
    setMenu(next);
    void sound.blip(next ? 0.7 : 0.4);
  };

  const inside = phase === "in" && !menu;
  const chapter = CHAPTERS[section];
  const last = CHAPTER_COUNT - 1;

  return (
    <div ref={rootRef} className={`experience showroom s-${section} ${menu ? "menu-open" : ""} ${phase === "in" ? "is-in" : ""} ${reduced ? "reduced" : ""}`}>
      <div className="stage-wrap" aria-hidden="true">
        {failed ? <div className="stage-fallback showroom-fallback" /> : (
          <StageBoundary onError={() => setFailed(true)}>
            <Stage sectionRef={sectionRef} menuRef={menuRef} fancy={fancy} reduced={reduced} paused={paused} onProgress={onProgress} />
          </StageBoundary>
        )}
      </div>

      <div className="vignette" aria-hidden="true" />
      <div className={`hud ${phase === "in" ? "is-on" : ""}`}>
        <header className="hero-header">
          <div className="header-left">
            <button type="button" className="about-btn menu-toggle" aria-expanded={menu} onClick={toggleMenu}>
              <span className={`menu-icon ${menu ? "is-x" : ""}`} aria-hidden="true"><span /><span /></span>
              {menu ? "Close" : "Menu"}
            </button>
            {menu ? null : <Link className="about-btn" href="/appointment">Visit</Link>}
          </div>
          <button type="button" className="logo-wrap" aria-label="Back to the opening" onClick={() => go(0)}>
            <span className="wordmark">JHUMA</span>
          </button>
          <button type="button" className={`audio-toggle ${audioOn ? "active" : ""}`} aria-label={audioOn ? "Mute audio" : "Play audio"} aria-pressed={audioOn} onClick={toggleAudio}>
            <AudioWave active={audioOn} />
          </button>
        </header>

        <main className="hero-main">
          <SplitText as="h1" text={CHAPTERS[0].title} className="hero-title showroom-hero" active={inside && shown === 0} />
        </main>

        {CHAPTERS.slice(1).map((item, i) => {
          const index = i + 1;
          const active = inside && shown === index;
          return (
            <section key={item.id} className={`section-content place-${item.place} ${active ? "active" : ""}`} aria-hidden={!active}>
              <div className="content-wrap">
                <p className="eyebrow">
                  <span>N° {String(offset + index).padStart(2, "0")}</span>
                  <span className="eyebrow-rule" />
                  <span>{item.eyebrow}</span>
                </p>
                <SplitText text={item.title} className="section-title" active={active} />
                <p className="section-desc">{item.desc}</p>
                <div className="section-highlight">
                  <span className="highlight-blur" />
                  {item.href ? (
                    <Link href={item.href} className="highlight-text highlight-btn" data-cursor="Open" tabIndex={active ? 0 : -1}>{item.highlight} →</Link>
                  ) : <p className="highlight-text">{item.highlight}</p>}
                </div>
                {index === last ? (
                  <div className="showroom-final">
                    <Link href="/collections" tabIndex={active ? 0 : -1}>Browse the collections</Link>
                    <button type="button" onClick={() => go(0)} tabIndex={active ? 0 : -1}>Walk the hall again ↺</button>
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}

        <aside className="hero-scroll" aria-hidden="true">
          <ScrollRail section={section} count={CHAPTER_COUNT} onJump={go} />
        </aside>

        <nav className="chapters" aria-label="Chapters">
          <span className="chapters-count">
            <span className="now">{String(offset + section + 1).padStart(2, "0")}</span>
            <span className="of">/ {String(total).padStart(2, "0")}</span>
          </span>
          <ol>
            {CHAPTERS.map((item, index) => (
              <li key={item.id}>
                <button type="button" className={index === section ? "is-active" : ""} aria-current={index === section ? "step" : undefined} onClick={() => go(index)}>
                  <span className="chapter-name">{item.name}</span>
                  <span className="chapter-tick" />
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <footer className={`hero-footer ${section === 0 ? "is-hero" : ""}`}>
          <div className="footer-left">
            <p className={`hero-desc ${inside && shown === 0 ? "is-on" : ""}`}>
              Jhuma <span className="secondary">keeps its gold on</span> royal blue velvet.
              <br />
              <span className="secondary">Fourth floor,</span> Sylhet Plaza, Zindabazar.
            </p>
            <button type="button" className={`cta-btn ${inside && shown === 0 ? "is-on" : ""}`} onClick={() => go(1)}>
              <span className="btn-fill" />
              <span className="btn-content"><span className="plus">+</span> OPEN THE FIRST BOX</span>
            </button>
          </div>
          <div className="footer-center">
            <div className="scroll-more">
              <span className="mouse-icon" aria-hidden="true"><span className="mouse-wheel" /></span>
              <span>{section === last ? "The end of the hall" : "Scroll to open the next"}</span>
            </div>
          </div>
        </footer>
      </div>

      <Menu open={menu} onClose={() => { menuRef.current = false; setMenu(false); }} />

      <div className={`loader ${phase === "leaving" || phase === "in" ? "is-leaving" : ""} ${phase === "in" ? "is-gone" : ""}`}>
        <div className={`loader-brand ${phase === "cta" || phase === "leaving" ? "exit" : ""}`}>
          <div className={`wordmark loader-logo ${logoOn ? "reveal" : ""}`}>JHUMA</div>
        </div>
        <div className={`loader-action ${phase === "cta" ? "is-on" : ""}`}>
          <button id="enter-btn" type="button" onClick={enter} data-cursor="">
            <svg className="enter-ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="98" /></svg>
            Enter Jhuma
          </button>
        </div>
        <div className="loader-meta" aria-hidden="true">
          <span>Jhuma Jewellers</span>
          <span>Zindabazar, Sylhet</span>
        </div>
        <LoaderCount value={Math.min(100, progress)} done={phase !== "boot"} />
        <p className={`loader-desc ${phase === "cta" || (skipIntro && phase === "boot") ? "is-on" : ""}`}>{skipIntro ? "Opening the hall…" : "Click to enter the salon · Best with sound"}</p>
        <div className="loader-progress" aria-hidden="true"><span style={{ width: `${Math.min(100, progress)}%` }} /></div>
      </div>

      <Cursor label={phase === "cta" ? "Enter" : inside ? "Scroll" : ""} />

      <p className="sr-only" aria-live="polite">
        {phase === "in" ? `${chapter.name}. ${chapter.title.replaceAll("\n", " ")}` : "Loading Jhuma Jewellers"}
      </p>
    </div>
  );
}

class StageBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
