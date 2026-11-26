import { AUTO_STOP_MS, TARGET_MS } from "../catalog.ts";

export function clampStoppedAt(ms: number): number {
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.min(AUTO_STOP_MS, ms);
}

export function timeDiffMs(stoppedAtMs: number): number {
  return Math.abs(clampStoppedAt(stoppedAtMs) - TARGET_MS);
}

export function formatClock(ms: number): string {
  return (clampStoppedAt(ms) / 1000).toFixed(3);
}

export function formatDiffLabel(stoppedAtMs: number): string {
  return `${formatClock(timeDiffMs(stoppedAtMs))}초`;
}

export function formatStoppedCaption(stoppedAtMs: number): string {
  return `멈춘 시각 ${formatClock(stoppedAtMs)}초`;
}

export function isAutoStop(ms: number): boolean {
  return clampStoppedAt(ms) >= AUTO_STOP_MS;
}

export type TimerPhase = "ready" | "running" | "stopped" | "autostop";

/** Live play waits on [카운트 시작]. Fixtures may still freeze a later phase. */
export function initialTimerPhase(fixture?: { phase: TimerPhase } | null): TimerPhase {
  return fixture?.phase ?? "ready";
}
