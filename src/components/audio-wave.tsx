"use client";

import { useEffect, useRef } from "react";

export function AudioWave({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 40;
    const height = 12;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let heightNow = 0;
    let ampNow = 0;
    let frame = 0;

    const draw = (time: number) => {
      const targetH = active ? 5.5 : 0;
      const targetA = active ? -0.18 : 0;
      heightNow += (targetH - heightNow) * 0.08;
      ampNow += (targetA - ampNow) * 0.08;

      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const seconds = time / 1000;
      for (let i = 0; i < 40; i++) {
        const x = width / 2 - 16 + i * 0.8;
        const y = height / 2 + -Math.cos(seconds * 3.7 + i * ampNow) * heightNow;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // A muted control is static; don't keep an animation loop alive for it.
      if (active || Math.abs(heightNow) > 0.05) frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return <canvas ref={canvasRef} className="audio-wave" aria-hidden="true" />;
}
