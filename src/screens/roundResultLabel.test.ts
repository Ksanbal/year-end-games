import { describe, expect, it } from "vitest";
import { copy } from "../copy.ts";
import { roundResultButtonLabel, roundResultButtonStyle } from "./roundResultLabel.ts";

describe("round result button", () => {
  it("uses 다음 라운드 at the same size and position after every round, including the last", () => {
    expect(copy.nextRound).toBe("다음 라운드");
    for (const round of [1, 2, 3, 4, 5] as const) {
      expect(roundResultButtonLabel(round)).toBe(copy.nextRound);
      expect(roundResultButtonStyle(round)).toEqual({ left: 760, top: 900 });
    }
  });
});
