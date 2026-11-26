import { describe, expect, it } from "vitest";
import { IDIOMS } from "./idioms.ts";
import { syllables } from "../game2/wordLogic.ts";

describe("IDIOMS", () => {
  it("has at least 60 unique four-character answers with a meaning", () => {
    const answers = IDIOMS.map((item) => item.answer);
    expect(answers.length).toBeGreaterThanOrEqual(60);
    expect(new Set(answers).size).toBe(answers.length);
    expect(answers.every((word) => syllables(word).length === 4)).toBe(true);
    expect(IDIOMS.every((item) => item.meaning.length > 0)).toBe(true);
  });
});
