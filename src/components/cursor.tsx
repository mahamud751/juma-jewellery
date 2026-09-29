"use client";

import { useEffect, useRef } from "react";

/**
 * Dot follows the pointer exactly; the ring trails it and swells over anything clickable.
 * Elements can name the ring's caption with data-cursor="View".
 * Only mounts its behaviour on fine pointers, so touch devices keep the native feel.
 */
export function Cursor({ label }: { label: string }) {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const fallback = useRef(label);

  useEffect(() => {
    fallback.current = label;
    if (text.current && !ring.current?.classList.contains("is-hover")) text.current.textContent = label;
  }, [label]);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const d = dot.current;
    const r = ring.current;
    const t = text.current;
    if (!d || !r || !t) return;

    document.documentElement.classList.add("has-cursor");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let frame = 0;
    let visible = false;

    const tick = () => {
      const k = reduce ? 1 : 0.16;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      r.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.1) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!visible) {
        visible = true;
        pos.x = target.x;
        pos.y = target.y;
        d.classList.add("is-on");
        r.classList.add("is-on");
      }
      d.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      if (!frame) frame = requestAnimationFrame(tick);

      const hit = (event.target as Element | null)?.closest("button, a, [data-cursor]");
      r.classList.toggle("is-hover", Boolean(hit));
      t.textContent = hit ? (hit.getAttribute("data-cursor") ?? "") : fallback.current;
    };
    const onLeave = () => {
      visible = false;
      d.classList.remove("is-on");
      r.classList.remove("is-on");
    };
    const onDown = () => r.classList.add("is-down");
    const onUp = () => r.classList.remove("is-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div ref={ring} className="cursor-ring">
        <span ref={text} className="cursor-label">{label}</span>
      </div>
      <div ref={dot} className="cursor-dot" />
    </div>
  );
}
