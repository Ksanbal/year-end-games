import { useEffect, useState } from "react";
import { tokenDurationMs } from "./cssDuration.ts";

function bezier(progress: number, x1: number, y1: number, x2: number, y2: number) {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 20; i++) {
    const t = (low + high) / 2;
    const x = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t ** 2 * x2 + t ** 3;
    if (x < progress) low = t;
    else high = t;
  }
  const t = (low + high) / 2;
  return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3;
}

export function useAnimatedCoins(from: number, to: number) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(reduced ? to : from);
  useEffect(() => {
    if (reduced || from === to) { setValue(to); return; }
    const duration = tokenDurationMs(to > from ? "--motion-coin-gain" : "--motion-coin-loss");
    if (!duration) { setValue(to); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = to > from ? bezier(progress, 0.2, 0, 0, 1) : bezier(progress, 0.4, 0, 1, 1);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, to, reduced]);
  return value;
}

export function AnimatedCoins({ from, to, prefix = "" }: { from: number; to: number; prefix?: string }) {
  const value = useAnimatedCoins(from, to);
  return <span className={`animated-coins ${to < from ? "is-loss" : "is-gain"}`} aria-label={`${prefix}${to}`}>{prefix}{value}</span>;
}
