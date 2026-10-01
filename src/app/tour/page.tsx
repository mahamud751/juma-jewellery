import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import { ShopTour } from "@/components/tour/shop-tour";

const bengali = Hind_Siliguri({ subsets: ["bengali"], weight: ["400", "600"], variable: "--font-bengali", display: "swap" });

export const metadata: Metadata = {
  title: { absolute: "Jhuma Jewellers — Visit the shop from home" },
  alternates: { canonical: "/tour" },
  description: "Walk into Jhuma Jewellers at Sylhet Plaza, Zindabazar, and look at every display: necklace sets, chains, rings and earrings, photographed in the shop.",
};

export default function Tour() {
  return <ShopTour bengaliFont={bengali.variable} />;
}
