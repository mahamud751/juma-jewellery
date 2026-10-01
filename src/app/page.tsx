import type { Metadata } from "next";
import { JourneyExperience } from "@/components/journey/journey-experience";

export const metadata: Metadata = {
  title: { absolute: "Jhuma Jewellers — Walk into the salon" },
  description: "From Zindabazar to the fourth floor of Sylhet Plaza. Walk through the Jhuma doors and turn each gold creation through 360 degrees.",
};

export default function Home() {
  return <JourneyExperience />;
}
