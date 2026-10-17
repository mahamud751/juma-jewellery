"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AudioWave } from "@/components/audio-wave";
import { Cursor } from "@/components/cursor";
import { PantherMark } from "@/components/panther";
import { Menu } from "@/components/site/menu";
import { HeroTitle, SplitText } from "@/components/split-text";
import { CHAPTERS, SECTION_COUNT, travelSeconds } from "@/lib/sections";
import { sound } from "@/lib/sound";

const Stage = dynamic(() => import("@/components/stage"), { ssr: false });

type Phase = "boot" | "cta" | "leaving" | "in";

const CHAPTER_NAMES = ["Overture", "Stillness", "Instinct", "Presence", "Constant", "Nocturne", "Heritage", "Legacy"];

export function Experience() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [section, setSection] = useState(0);
  /** The chapter whose copy is on screen: -1 while the camera is still flying. */
  const [shown, setShown] = useState(0);
  const [about, setAbout] = useState(false);
  const [menu, setMenu] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [progress, setProgress] = useState(8);
  const [reduced, setReduced] = useState(false);
  // Start conservatively. Upgrading after capability detection is much cheaper
  // than briefly allocating retina render targets on an ordinary laptop.
  const [fancy, setFancy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [logoOn, setLogoOn] = useState(false);
  const [failed, setFailed] = useState(false);

  const sectionRef = useRef(0);
  const aboutRef = useRef(false);
  const enteredRef = useRef(false);
  const lockRef = useRef(false);
  const arriveRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sectionRef.current = section;
    aboutRef.current = about || menu;
    enteredRef.current = phase === "in";
  }, [section, about, menu, phase]);

  const onProgress = useCallback((value: number) => {
    setProgress((current) => Math.max(current, value));
  }, []);

  const go = useCallback((next: number) => {
    if (!enteredRef.current || aboutRef.current || lockRef.current) return;
    const clamped = Math.min(SECTION_COUNT - 1, Math.max(0, next));
    if (clamped === sectionRef.current) return;
    // The copy leaves at once, the camera flies, and the new copy lands as it settles.
    const flight = reduced ? 0 : travelSeconds(sectionRef.current, clamped) * 1000;
    sectionRef.current = clamped;
    setSection(clamped);
    setShown(-1);
    lockRef.current = true;
    window.clearTimeout(arriveRef.current);
    arriveRef.current = window.setTimeout(() => setShown(clamped), flight * 0.7);
    window.setTimeout(() => {
      lockRef.current = false;
    }, flight);
  }, [reduced]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 900px)");
    const sync = () => {
      const navigatorWithHints = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean };
      };
      const memory = navigatorWithHints.deviceMemory;
      const cores = navigator.hardwareConcurrency || 4;
      const constrained =
        navigatorWithHints.connection?.saveData === true ||
        (memory !== undefined && memory < 8) ||
        cores < 8;
      setReduced(reduce.matches);
      setFancy(wide.matches && !reduce.matches && !constrained);
    };
    sync();
    reduce.addEventListener("change", sync);
    wide.addEventListener("change", sync);

    const reveal = window.setTimeout(() => setLogoOn(true), 480);
    const minTime = window.setTimeout(() => setProgress((value) => Math.max(value, 100)), 2400);
    const giveUp = window.setTimeout(() => setProgress(100), 5200);

    const onHide = () => {
      const hidden = document.hidden;
      setPaused(hidden);
      void sound.duck(hidden);
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
      const timer = window.setTimeout(() => setPhase("cta"), reduced ? 200 : 700);
      return () => window.clearTimeout(timer);
    }
  }, [phase, progress, reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Small deltas are gathered until they add up to a real push. After a flight
    // a trackpad keeps firing a fading tail of small events; those are ignored
    // until the gesture pauses or pushes harder again. Mouse notches are large
    // and always count once the camera has landed.
    let lastWheel = 0;
    let lastAbs = 0;
    let gathered = 0;
    let spent = false;
    const onWheel = (event: WheelEvent) => {
      if (!enteredRef.current || aboutRef.current) return;
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
    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const endY = event.changedTouches[0]?.clientY ?? startY;
      const delta = startY - endY;
      if (Math.abs(delta) < 42) return;
      go(sectionRef.current + Math.sign(delta));
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && aboutRef.current) {
        setAbout(false);
        setMenu(false);
        return;
      }
      if (event.key === "ArrowDown" || event.key === "PageDown") {
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
        go(SECTION_COUNT - 1);
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

  const toggleAbout = () => {
    if (phase !== "in") return;
    const next = !aboutRef.current;
    aboutRef.current = next;
    setAbout(next);
    setMenu(false);
    void sound.blip(0.55);
  };

  const toggleMenu = () => {
    if (phase !== "in") return;
    const next = !menu;
    aboutRef.current = next;
    setMenu(next);
    setAbout(false);
    void sound.blip(next ? 0.7 : 0.4);
  };

  const overlay = about || menu;
  const cursorLabel = phase === "cta" ? "Enter" : phase === "in" && !overlay ? "Scroll" : "";

  const chapter = CHAPTERS[section - 1];

  return (
    <div
      ref={rootRef}
      className={`experience s-${section} ${about ? "about-open" : ""} ${menu ? "menu-open" : ""} ${phase === "in" ? "is-in" : ""} ${reduced ? "reduced" : ""}`}
    >
      <div className="stage-wrap" aria-hidden={failed}>
        {failed ? <div className="stage-fallback" /> : (
          <StageError onError={() => setFailed(true)}>
            <Stage
              sectionRef={sectionRef}
              aboutRef={aboutRef}
              fancy={fancy}
              reduced={reduced}
              paused={paused}
              onProgress={onProgress}
            />
          </StageError>
        )}
      </div>

      <div className="vignette" aria-hidden="true" />
      <div className={`hud ${phase === "in" ? "is-on" : ""}`}>
        <header className="hero-header">
          <div className="header-left">
            <button type="button" className="about-btn menu-toggle" aria-expanded={menu} onClick={toggleMenu}>
              <span className={`menu-icon ${menu ? "is-x" : ""}`} aria-hidden="true">
                <span />
                <span />
              </span>
              {menu ? "Close" : "Menu"}
            </button>
            {menu ? null : (
              <button type="button" className="about-btn" onClick={toggleAbout}>
                {about ? "Close" : "About"}
              </button>
            )}
          </div>
          <button
            type="button"
            className="logo-wrap"
            aria-label="Return to the opening"
            onClick={() => {
              void sound.blip(0.4);
              go(0);
            }}
          >
            <span className="wordmark">GRAIR</span>
          </button>
          <button
            type="button"
            className={`audio-toggle ${audioOn ? "active" : ""}`}
            aria-label={audioOn ? "Mute cinematic audio" : "Play cinematic audio"}
            aria-pressed={audioOn}
            onClick={toggleAudio}
          >
            <AudioWave active={audioOn} />
          </button>
        </header>

        <main className="hero-main">
          <HeroTitle active={phase === "in" && shown === 0 && !overlay} />
        </main>

        {CHAPTERS.map((item, index) => {
          const active = phase === "in" && shown === index + 1 && !overlay;
          return (
            <section key={item.id} className={`section-content place-${item.place} ${active ? "active" : ""}`}>
              <div className="content-wrap">
                <p className="eyebrow">
                  <span>N° {String(index + 1).padStart(2, "0")}</span>
                  <span className="eyebrow-rule" />
                  <span>{CHAPTER_NAMES[index + 1]}</span>
                </p>
                <SplitText text={item.title} className="section-title" active={active} />
                <p className="section-desc">{item.desc}</p>
                <div className="section-highlight">
                  <span className="highlight-blur" />
                  {item.href ? (
                    <Link href={item.href} className="highlight-text highlight-btn" data-cursor="Open">
                      {item.highlight} →
                    </Link>
                  ) : (
                    <p className="highlight-text">{item.highlight}</p>
                  )}
                </div>
              </div>
            </section>
          );
        })}

        <aside className="hero-scroll" aria-hidden="true">
          <ScrollRail
            section={section}
            onJump={(index) => {
              void sound.blip(0.25);
              go(index);
            }}
          />
        </aside>

        <nav className="chapters" aria-label="Chapters">
          <span className="chapters-count">
            <span className="now">{String(section + 1).padStart(2, "0")}</span>
            <span className="of">/ {String(SECTION_COUNT).padStart(2, "0")}</span>
          </span>
          <ol>
            {CHAPTER_NAMES.map((name, index) => (
              <li key={name}>
                <button
                  type="button"
                  className={index === section ? "is-active" : ""}
                  aria-current={index === section ? "step" : undefined}
                  onClick={() => {
                    void sound.blip(0.25);
                    go(index);
                  }}
                >
                  <span className="chapter-name">{name}</span>
                  <span className="chapter-tick" />
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <footer className={`hero-footer ${section === 0 ? "is-hero" : ""}`}>
          <div className="footer-left">
            <p className={`hero-desc ${phase === "in" && shown === 0 ? "is-on" : ""}`}>
              Grair <span className="secondary">is formed in</span> restraint.
              <br />
              <span className="secondary">Crafted for those who do not need to</span> announce their presence.
            </p>
            <button
              type="button"
              className={`cta-btn ${phase === "in" && shown === 0 ? "is-on" : ""}`}
              onClick={() => {
                void sound.blip(0.7);
                go(1);
              }}
            >
              <span className="btn-fill" />
              <span className="btn-content">
                <span className="plus">+</span> ENTER THE SILENCE
              </span>
            </button>
          </div>
          <div className="footer-center">
            <div className="scroll-more">
              <span className="mouse-icon" aria-hidden="true">
                <span className="mouse-wheel" />
              </span>
              <span>Scroll more</span>
            </div>
          </div>
        </footer>
      </div>

      <div className={`about ${about ? "is-open" : ""}`} aria-hidden={!about}>
        <div className="about-center">
          <PantherMark drawn={about} />
          <p className="about-text">
            GRAIR IS A CONCEPTUAL LUXURY JEWELRY BRAND CREATED BY{" "}
            <a className="undream-link" href="https://undreamstudio.com/" target="_blank" rel="noreferrer">
              UNDREAM STUDIO
            </a>{" "}
            TO SHOWCASE IMMERSIVE DIGITAL EXPERIENCES FOR MODERN LUXURY FASHION AND DIAMOND BRANDS. THE
            PROJECT BLENDS CINEMATIC 3D STORYTELLING, MINIMAL DESIGN SYSTEMS, AND INTERACTIVE WEB
            TECHNOLOGIES TO CREATE A REFINED AND EMOTIONALLY DRIVEN LUXURY EXPERIENCE.
          </p>
        </div>
      </div>

      <Menu open={menu} onClose={() => { aboutRef.current = false; setMenu(false); }} />

      <div className={`loader ${phase === "leaving" || phase === "in" ? "is-leaving" : ""} ${phase === "in" ? "is-gone" : ""}`}>
        <div className={`loader-brand ${phase === "cta" || phase === "leaving" ? "exit" : ""}`}>
          <div className={`wordmark loader-logo ${logoOn ? "reveal" : ""}`}>GRAIR</div>
        </div>
        <div className={`loader-action ${phase === "cta" ? "is-on" : ""}`}>
          <button id="enter-btn" type="button" onClick={enter} data-cursor="">
            <svg className="enter-ring" viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="98" />
            </svg>
            Click to Grair
          </button>
        </div>
        <div className="loader-meta" aria-hidden="true">
          <span>Maison GRAIR</span>
          <span>Est. MMXXVI</span>
        </div>
        <LoaderCount value={Math.min(100, progress)} done={phase !== "boot"} />
        <p className={`loader-desc ${phase === "cta" ? "is-on" : ""}`}>Click to enter in the world of Grair · Best with sound</p>
        <div className="loader-progress" aria-hidden="true">
          <span style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      </div>

      <Cursor label={cursorLabel} />

      <p className="sr-only" aria-live="polite">
        {phase === "in"
          ? section === 0
            ? "Power without noise"
            : `${chapter?.title.replaceAll("\n", " ")}`
          : "Loading GRAIR"}
      </p>
    </div>
  );
}

/** Counts up toward the real load progress so the number never jumps. */
export function LoaderCount({ value, done }: { value: number; done: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRef(0);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      shown.current += (value - shown.current) * 0.06;
      if (value - shown.current < 0.5) shown.current = value;
      if (ref.current) ref.current.textContent = String(Math.round(shown.current)).padStart(3, "0");
      if (shown.current !== value) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <div ref={ref} className={`loader-count ${done ? "is-done" : ""}`} aria-hidden="true">000</div>;
}

export function ScrollRail({ section, onJump, count = SECTION_COUNT }: { section: number; onJump: (index: number) => void; count?: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const gemRef = useRef<HTMLDivElement>(null);
  const current = useRef(0);

  useEffect(() => {
    const path = pathRef.current;
    const gem = gemRef.current;
    if (!path || !gem) return;
    const length = path.getTotalLength();
    let frame = 0;
    const tick = () => {
      current.current += (section - current.current) * 0.07;
      const point = path.getPointAtLength(length * (current.current / (count - 1)));
      gem.style.left = `${(point.x / 30) * 100}%`;
      gem.style.top = `${(point.y / 452) * 100}%`;
      if (Math.abs(section - current.current) > 0.001) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [section, count]);

  return (
    <div
      className="scroll-track"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientY - rect.top) / rect.height;
        onJump(Math.round(Math.min(1, Math.max(0, ratio)) * (count - 1)));
      }}
    >
      <svg className="scroll-path" viewBox="0 0 30 452" preserveAspectRatio="none">
        <path
          ref={pathRef}
          d="M10.1025 0.0507812L1.24079 87.6049C-1.15007 111.227 2.13855 135.078 10.8327 157.171L19.108 178.2C32.6214 212.54 32.9106 250.673 19.9195 285.214L11.7577 306.915C2.48674 331.565 -0.0852929 358.231 4.30354 384.198L15.6025 451.051"
          stroke="white"
          strokeOpacity="0.28"
          strokeDasharray="2 10"
          fill="none"
        />
      </svg>
      <div ref={gemRef} className="scroll-gem" />
    </div>
  );
}

function StageError({ children, onError }: { children: ReactNode; onError: () => void }) {
  return <ErrorBoundary onError={onError}>{children}</ErrorBoundary>;
}

class ErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
