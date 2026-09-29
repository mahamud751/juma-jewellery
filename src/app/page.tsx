import type { Metadata } from "next";
import { ShopExperience } from "@/components/shop-experience";

export const metadata: Metadata = {
  title: { absolute: "Jhuma Jewellers — Walk the salon" },
  description: "A walk through the rooms of Jhuma Jewellers. The gold on the walls is photographed in the salon at Zindabazar.",
};

export default function Home() {
  return <ShopExperience />;
}
