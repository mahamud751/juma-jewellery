"use client";

import { View } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { EnvProvider, Studio } from "@/components/jewels";

/**
 * One WebGL canvas fixed over the page. Every <JewelView> on the page is a
 * tracked rectangle that renders into it, so twenty cards cost one context.
 */
export default function SiteCanvas() {
  return (
    <Canvas
      className="site-canvas"
      eventSource={document.body}
      eventPrefix="client"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
    >
      <Studio neutral />
      <EnvProvider>
        <View.Port />
      </EnvProvider>
    </Canvas>
  );
}
