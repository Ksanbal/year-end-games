import { describe, expect, it } from "vitest";
import {
  clampStoppedAt,
  formatClock,
  formatDiffLabel,
  formatStoppedCaption,
  initialTimerPhase,
  isAutoStop,
  timeDiffMs,
} from "./timer.ts";

describe("timer math", () => {
  it("records the difference to 10 seconds at 0.001s precision", () => {
    expect(formatClock(6_482)).toBe("6.482");
    expect(formatDiffLabel(10_137)).toBe("0.137초");
    expect(formatStoppedCaption(10_137)).toBe("멈춘 시각 10.137초");
    expect(timeDiffMs(9_874)).toBe(126);
    expect(formatDiffLabel(9_874)).toBe("0.126초");
    expect(formatStoppedCaption(9_874)).toBe("멈춘 시각 9.874초");
  });

  it("auto-stops at 20 seconds and records a 10 second difference", () => {
    expect(isAutoStop(20_000)).toBe(true);
    expect(isAutoStop(19_999)).toBe(false);
    expect(clampStoppedAt(25_000)).toBe(20_000);
    expect(timeDiffMs(20_000)).toBe(10_000);
    expect(formatDiffLabel(20_000)).toBe("10.000초");
    expect(formatStoppedCaption(20_000)).toBe("멈춘 시각 20.000초");
  });

  it("clamps a negative or non-finite stop to 0", () => {
    expect(clampStoppedAt(-1)).toBe(0);
    expect(clampStoppedAt(Number.NaN)).toBe(0);
    expect(formatClock(0)).toBe("0.000");
  });
});

describe("timer start phase", () => {
  it("waits on the ready phase until the count-start press", () => {
    expect(initialTimerPhase(null)).toBe("ready");
    expect(initialTimerPhase(undefined)).toBe("ready");
  });

  it("keeps a fixture frozen on its designed phase, including 05-0 ready", () => {
    expect(initialTimerPhase({ phase: "ready" })).toBe("ready");
    expect(initialTimerPhase({ phase: "running" })).toBe("running");
    expect(initialTimerPhase({ phase: "stopped" })).toBe("stopped");
  });
});
