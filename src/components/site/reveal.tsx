"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Tag = "div" | "p" | "h1" | "h2" | "article" | "blockquote" | "section";

/** Fades and lifts its content in the first time it scrolls into view. */
export function Reveal({
  as: Tag = "div",
  className,
  delay = 0,
  children,
}: {
  as?: Tag;
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.classList.add("is-in");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref as React.Ref<never>} className={`reveal ${className ?? ""}`} style={{ ["--delay" as string]: `${delay}s` }}>
      {children}
    </Tag>
  );
}
