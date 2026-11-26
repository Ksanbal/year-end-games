import { describe, expect, it } from "vitest";
import {
  MAX_QUESTIONS,
  TIME_LIMIT_MS,
  dealCards,
  formatRemain,
  isCorrect,
  pickProblem,
  remainLabel,
  syllables,
} from "./wordLogic.ts";
import { COUNTRIES } from "./countries.ts";

describe("syllables", () => {
  it("splits a country name into Hangul syllables with no spaces", () => {
    expect(syllables("뉴질랜드")).toEqual(["뉴", "질", "랜", "드"]);
    expect(syllables("미국")).toEqual(["미", "국"]);
    expect(syllables("도미니카공화국")).toHaveLength(7);
  });
});

describe("isCorrect", () => {
  it("accepts only the exact syllable order", () => {
    expect(isCorrect(["뉴", "질", "랜", "드"], "뉴질랜드")).toBe(true);
    expect(isCorrect(["질", "뉴", "랜", "드"], "뉴질랜드")).toBe(false);
    expect(isCorrect(["뉴", "질", "랜", null], "뉴질랜드")).toBe(false);
  });
});

describe("dealCards", () => {
  it("keeps every syllable, including duplicates", () => {
    const cards = dealCards("스위스", () => 0);
    expect([...cards].sort()).toEqual(["스", "스", "위"].sort());
  });
});

describe("pickProblem", () => {
  it("skips answers already used in the round", () => {
    const used = new Set(["가나", "네팔"]);
    const picked = pickProblem(COUNTRIES, used, () => 0);
    expect(picked?.answer).not.toBe("가나");
    expect(picked?.answer).not.toBe("네팔");
  });

  it("returns null when the pool is exhausted", () => {
    const used = new Set(COUNTRIES.map((c) => c.answer));
    expect(pickProblem(COUNTRIES, used)).toBeNull();
  });
});

describe("labels and limits", () => {
  it("formats the remaining time as minutes and seconds, starting from one minute", () => {
    expect(TIME_LIMIT_MS).toBe(60_000);
    expect(formatRemain(TIME_LIMIT_MS)).toBe("1:00");
    expect(remainLabel(TIME_LIMIT_MS)).toBe("남은 시간 1:00");
    expect(remainLabel(52_000)).toBe("남은 시간 0:52");
    expect(remainLabel(12_000)).toBe("남은 시간 0:12");
    expect(remainLabel(0)).toBe("남은 시간 0:00");
  });

  it("stops a turn after 20 problems, counting skips", () => {
    expect(MAX_QUESTIONS).toBe(20);
  });
});

describe("COUNTRIES", () => {
  it("has at least 60 unique 2–7 syllable names", () => {
    const answers = COUNTRIES.map((c) => c.answer);
    expect(answers.length).toBeGreaterThanOrEqual(60);
    expect(new Set(answers).size).toBe(answers.length);
    expect(answers.every((name) => name.length >= 2 && name.length <= 7)).toBe(true);
  });
});
