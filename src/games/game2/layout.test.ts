import { describe, expect, it } from "vitest";
import { CARD, SKIP_TOP, WRONG_H, answerLayout } from "./layout.ts";

describe("answer layout", () => {
  it("keeps the game 2 wrong-answer line in its designed gap under the cards", () => {
    const layout = answerLayout(4, 0);
    expect(layout.cardY).toBe(580);
    expect(layout.wrongY).toBe(800);
    expect(layout.wrongY).toBeGreaterThanOrEqual(layout.cardY + CARD);
    expect(layout.wrongY + WRONG_H).toBeLessThanOrEqual(SKIP_TOP);
  });

  it("places the game 3 wrong-answer line below the cards and above the skip button", () => {
    const layout = answerLayout(4, 70);
    expect(layout.wrongY).toBeGreaterThanOrEqual(layout.cardY + CARD);
    expect(layout.wrongY + WRONG_H).toBeLessThanOrEqual(SKIP_TOP);
  });
});
