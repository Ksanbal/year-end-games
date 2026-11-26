import type { WordFixture } from "./WordPlay.tsx";

const NZ = { answer: "뉴질랜드" };
const CARDS = ["랜", "뉴", "드", "질"];

export function screenCode(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("screen");
}

export function wordFixture(code: string | null): WordFixture | null {
  if (code === "03-1") {
    return { problem: NZ, cards: CARDS, slots: ["뉴", "질", null, null], score: 5, remainMs: 32_000, phase: "playing" };
  }
  if (code === "03-2") {
    return { problem: NZ, cards: CARDS, slots: ["질", "뉴", "랜", "드"], score: 5, remainMs: 28_000, phase: "wrong" };
  }
  if (code === "03-3") {
    return { problem: NZ, cards: CARDS, slots: ["뉴", "질", "랜", "드"], score: 12, remainMs: 12_000, phase: "complete" };
  }
  if (code === "03-4") {
    return { problem: NZ, cards: CARDS, slots: ["뉴", null, "랜", "드"], score: 9, remainMs: 0, phase: "timeup" };
  }
  return null;
}
