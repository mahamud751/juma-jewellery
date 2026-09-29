"use client";

import { Fragment, useState, type CSSProperties } from "react";

type Tag = "h1" | "h2" | "p" | "div";

/** A stable 0–1 value per letter, so letters light up in a scattered order that matches on server and client. */
const scatter = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)).toFixed(3);
};

/**
 * Letters animate one by one, but each word stays in its own nowrap box
 * so a line can only ever break between words. `start` offsets the stagger.
 */
function Words({ text, start }: { text: string; start: number }) {
  const words = text.split(" ");
  let index = start;
  return words.map((word, w) => (
    <Fragment key={`${word}-${w}`}>
      <span className="word">
        {Array.from(word).map((char, c) => (
          <span className="ch" key={c} style={{ ["--r" as string]: scatter(index++) }}>
            {char}
          </span>
        ))}
      </span>
      {w < words.length - 1 ? " " : null}
    </Fragment>
  ));
}

/** Where each chunk's stagger begins: the letter count of everything before it. */
const offsets = (chunks: string[]) =>
  chunks.map((_, i) => chunks.slice(0, i).reduce((sum, chunk) => sum + chunk.replaceAll(" ", "").length, 0));

/** The window the scattered letters arrive across: 20ms per letter, as on GRAIR. */
const span = (text: string): CSSProperties => ({ ["--span" as string]: `${text.replace(/\s/g, "").length * 20}ms` });

/**
 * "is-on" plays the letters in; once text has been shown, losing `active`
 * plays them out ("is-out") instead of snapping back to hidden.
 */
function usePhase(active: boolean) {
  const [shown, setShown] = useState(active);
  if (active && !shown) setShown(true);
  return active ? "is-on" : shown ? "is-out" : "";
}

export function SplitText({
  text,
  className,
  active,
  as: TagName = "h2",
}: {
  text: string;
  className?: string;
  active: boolean;
  as?: Tag;
}) {
  const phase = usePhase(active);
  const lines = text.split("\n").map((line) => line.trim());
  const starts = offsets(lines);

  return (
    <TagName className={`split ${className ?? ""} ${phase}`} style={span(text)}>
      {lines.map((line, lineIndex) => (
        <span className="split-line" key={`${line}-${lineIndex}`}>
          <Words text={line} start={starts[lineIndex]} />
          {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </TagName>
  );
}

/** Hero lockup: the second break only appears on small screens, matching GRAIR. */
export function HeroTitle({ active }: { active: boolean }) {
  const phase = usePhase(active);
  const [a, b, c] = offsets(["Power", "without", "noise"]);
  return (
    <h1 className={`split hero-title ${phase}`} style={span("Powerwithoutnoise")}>
      <Words text="Power" start={a} />
      <br />
      <Words text="without" start={b} />
      {" "}
      <br className="mob-br" />
      <Words text="noise" start={c} />
    </h1>
  );
}
