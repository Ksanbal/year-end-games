import { useEffect, useRef } from "react";
import { tokenDurationMs } from "./cssDuration.ts";
import "./confetti.css";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  width: number;
  height: number;
  color: string;
};

const COLORS = ["#C7362B", "#F2B630", "#1B2A4A", "#FFFFFF", "#4A7AD4", "#EE8B6A"];

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function burst(originX: number, originY: number, inward: 1 | -1): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 42; i++) {
    const speed = 12 + Math.random() * 16;
    const angle = (-90 + inward * (18 + Math.random() * 55)) * (Math.PI / 180);
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.4,
      width: 8 + Math.random() * 10,
      height: 5 + Math.random() * 7,
      color: COLORS[i % COLORS.length]!,
    });
  }
  return particles;
}

export function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const duration = tokenDurationMs("--motion-confetti-duration", 1600);
    const particles = [...burst(0, 1080, 1), ...burst(1920, 1080, -1)];
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const t = Math.min(1, elapsed / duration);
      ctx.clearRect(0, 0, 1920, 1080);
      const gravity = 0.35;
      const drag = 0.992;
      for (const p of particles) {
        p.vy += gravity;
        p.vx *= drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        const fade = 1 - t * t;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  if (reduced) return null;
  return <canvas ref={canvasRef} className="confetti-layer" width={1920} height={1080} aria-hidden="true" />;
}
