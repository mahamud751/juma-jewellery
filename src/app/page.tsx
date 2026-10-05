import type { Metadata } from "next";
import { JourneyExperience } from "@/components/journey/journey-experience";

export const metadata: Metadata = {
  title: { absolute: "Jhuma Jewellers — Walk into the salon" },
  description: "From Zindabazar to the fourth floor of Sylhet Plaza. Walk through the Jhuma doors and turn the jewellery photographed in the salon.",
};

export default function Home() {
  return <JourneyExperience />;
}
