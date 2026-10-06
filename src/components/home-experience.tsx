"use client";

import { useState } from "react";
import { JourneyExperience } from "@/components/journey/journey-experience";
import { ShowroomExperience } from "@/components/showroom/showroom-experience";
import { STOPS } from "@/lib/journey";
import { CHAPTERS, CHAPTER_COUNT } from "@/lib/showroom";

/** The walk runs from Sylhet Plaza to the chain gallery, then the hall takes over. */
const WALK_END = 5;
const TOTAL = WALK_END + 1 + CHAPTER_COUNT;
const WALK_LABELS = STOPS.slice(0, WALK_END + 1).map((stop) => stop.label);
const HALL_LABELS = CHAPTERS.map((chapter) => chapter.name);

type Part = { kind: "walk" | "hall"; at: number };

/** One home page of sixteen steps: the photographed walk, then the hall of opening cases. */
export function HomeExperience() {
  const [part, setPart] = useState<Part>({ kind: "walk", at: 0 });
  return part.kind === "walk" ? (
    <JourneyExperience
      key={`walk${part.at}`}
      end={WALK_END}
      total={TOTAL}
      startAt={part.at}
      after={HALL_LABELS}
      onEnd={(step = 0) => setPart({ kind: "hall", at: step })}
    />
  ) : (
    <ShowroomExperience
      key={`hall${part.at}`}
      startAt={part.at}
      before={WALK_LABELS}
      offset={WALK_END + 1}
      total={TOTAL}
      onBack={(stop) => setPart({ kind: "walk", at: stop })}
      onRestart={() => setPart({ kind: "walk", at: 0 })}
    />
  );
}
