import type { WordFixture } from "../game2/WordPlay.tsx";
import { IDIOMS } from "./idioms.ts";

const IDIOM = {
  answer: "고진감래",
  meaning: "쓴 것이 다하면 단 것이 온다는 말로, 힘든 뒤에 즐거움이 옴.",
};
const CARDS = ["감", "래", "고", "진"];

export function screenCode(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("screen");
}

export function idiomFixture(code: string | null): WordFixture | null {
  if (code === "04-1") {
    return { problem: IDIOM, cards: CARDS, slots: ["고", "진", null, null], score: 5, remainMs: 52_000, phase: "playing" };
  }
  if (code === "04-1-long") {
    const problem = IDIOMS.find((item) => item.answer === "구사일생") ?? IDIOMS.reduce((longest, item) =>
      item.meaning.length > longest.meaning.length ? item : longest,
    );
    const cards = [...problem.answer];
    return { problem, cards, slots: [cards[0] ?? null, cards[1] ?? null, null, null], score: 5, remainMs: 52_000, phase: "playing" };
  }
  if (code === "04-2") {
    return { problem: IDIOM, cards: CARDS, slots: ["진", "고", "감", "래"], score: 5, remainMs: 48_000, phase: "wrong" };
  }
  if (code === "04-2-long") {
    const problem = IDIOMS.reduce((longest, item) =>
      item.meaning.length > longest.meaning.length ? item : longest,
    );
    const cards = [...problem.answer];
    return { problem, cards, slots: [...cards].reverse(), score: 5, remainMs: 48_000, phase: "wrong" };
  }
  if (code === "04-3") {
    return { problem: IDIOM, cards: CARDS, slots: ["고", "진", "감", "래"], score: 12, remainMs: 12_000, phase: "complete" };
  }
  if (code === "04-4") {
    return { problem: IDIOM, cards: CARDS, slots: ["고", "진", null, "래"], score: 9, remainMs: 0, phase: "timeup" };
  }
  return null;
}
