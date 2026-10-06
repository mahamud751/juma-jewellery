import type { Metadata } from "next";
import { HomeExperience } from "@/components/home-experience";

export const metadata: Metadata = {
  title: { absolute: "Jhuma Jewellers — Gold, the Sylhet way" },
  description: "Walk from Zindabazar up to the Jhuma salon, then scroll through the hall: a box, a cabinet, a curtain and a drawer open one by one on the jewellery photographed in the salon.",
};

export default function Home() {
  return <HomeExperience />;
}
