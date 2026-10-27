"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Tag = "div" | "p" | "h1" | "h2" | "article" | "blockquote" | "section";

/** Fades and lifts its content the first time it scrolls into view. */
export function Reveal({
  as: Tag = "div",
  className,
  delay = 0,
  style,
  children,
}: {
  as?: Tag;
  className?: string;
  delay?: number;
  style?: CSSProperties;
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
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`reveal ${className ?? ""}`}
      style={{ ...style, ["--delay" as string]: `${delay}s` }}
    >
      {children}
    </Tag>
  );
}
