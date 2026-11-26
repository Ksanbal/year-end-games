import type { ReelStops, SlotView } from "./logic.ts";

export type FrozenSpin = "all" | "left";

export type SlotFixture = {
  code: string;
  view: SlotView;
  leverDown?: boolean;
  frozenSpin?: FrozenSpin;
};

const SEVENS: ReelStops = ["seven", "seven", "seven"];
const MISS: ReelStops = ["seven", "cherry", "bell"];
const DASH: SlotView = {
  kind: "result",
  outcome: { kind: "skip" },
  stops: ["dash", "dash", "dash"],
};

export function readScreenCode(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("screen");
}

export function readSlotFixture(): SlotFixture | null {
  const code = readScreenCode();
  return code ? fixtureFor(code) : null;
}

export function e2eEnabled(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("e2e");
}

export function fixtureFor(code: string): SlotFixture | null {
  switch (code) {
    case "09-1":
      return { code, view: { kind: "betting", bet: 1, confirmAllIn: false } };
    case "09-6":
      return { code, view: { kind: "betting", bet: 1, confirmAllIn: true } };
    case "09-1b":
      return { code, view: { kind: "ready", bet: 20 } };
    case "09-2":
      return { code, view: { kind: "spinning", bet: 20, stops: SEVENS }, leverDown: true, frozenSpin: "all" };
    case "09-2a":
      return { code, view: { kind: "spinning", bet: 20, stops: MISS }, leverDown: true, frozenSpin: "left" };
    case "09-3":
      return { code, view: { kind: "result", outcome: { kind: "win", bet: 20 }, stops: SEVENS } };
    case "09-4":
      return { code, view: { kind: "result", outcome: { kind: "lose", bet: 20 }, stops: MISS } };
    case "09-5":
      return { code, view: DASH };
    case "09-7":
      return { code, view: { kind: "result", outcome: { kind: "lose", bet: 170 }, stops: MISS } };
    default:
      return null;
  }
}
