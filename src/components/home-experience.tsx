"use client";

import { useState } from "react";
import { JourneyExperience } from "@/components/journey/journey-experience";
import { ShowroomExperience } from "@/components/showroom/showroom-experience";
import { CHAPTER_COUNT } from "@/lib/showroom";

/** The walk runs from Sylhet Plaza to the chain gallery, then the hall takes over. */
const WALK_END = 5;
const TOTAL = WALK_END + 1 + CHAPTER_COUNT;

export function HomeExperience() {
  const [part, setPart] = useState<"walk" | "hall">("walk");
  const [returning, setReturning] = useState(false);
  return part === "walk" ? (
    <JourneyExperience key="walk" end={WALK_END} total={TOTAL} startAtEnd={returning} onEnd={() => setPart("hall")} />
  ) : (
    <ShowroomExperience key="hall" skipIntro offset={WALK_END + 1} total={TOTAL} onBack={() => { setReturning(true); setPart("walk"); }} />
  );
}
