"use client";

import { Environment, OrbitControls, PerspectiveCamera, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useContext, useRef } from "react";
import * as THREE from "three";
import { EnvContext } from "@/components/jewels";
import { Jewel } from "@/components/models";
import type { Model, StoneId } from "@/lib/catalog";

type Props = {
  model: Model;
  metal: string;
  stone: StoneId;
  className?: string;
  /** Drag to turn, scroll to zoom. Used on the piece page. */
  controls?: boolean;
  distance?: number;
};

function Turn({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    if (enabled) g.rotation.y += delta * 0.35;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
  });
  return <group ref={group}>{children}</group>;
}

function Scene({ model, metal, stone, controls, distance = 3.3 }: Props) {
  const env = useContext(EnvContext);
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, distance * 0.2, distance]} fov={30} onUpdate={(camera) => camera.lookAt(0, 0, 0)} />
      {env ? <Environment map={env} /> : null}
      <ambientLight intensity={0.25} />
      <spotLight position={[2.5, 4, 3]} angle={0.5} penumbra={1} intensity={28} color="#f6f2ff" />
      <pointLight position={[-2.5, 0.5, -1.5]} intensity={6} color="#8a55ff" />
      <Turn enabled={!controls}>
        <Jewel model={model} metal={metal} stone={stone} />
      </Turn>
      {controls ? (
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={1.6}
          maxDistance={4}
          autoRotate
          autoRotateSpeed={0.8}
          enableDamping
        />
      ) : null}
    </>
  );
}

export function JewelView({ className, ...props }: Props) {
  return (
    <div className={`jewel-view ${className ?? ""}`} data-cursor={props.controls ? "Drag" : undefined}>
      <View className="jewel-view-port">
        <Scene {...props} />
      </View>
    </div>
  );
}
