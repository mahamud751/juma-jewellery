"use client";

import dynamic from "next/dynamic";

const SiteCanvas = dynamic(() => import("@/components/site/site-canvas"), { ssr: false });

export function CanvasLoader() {
  return <SiteCanvas />;
}
