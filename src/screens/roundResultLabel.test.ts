import { describe, expect, it } from "vitest";
import { copy } from "../copy.ts";
import { roundResultButtonLabel } from "./roundResultLabel.ts";

describe("round result button", () => {
  it("keeps 다음 라운드 on every 08 screen, including the last round", () => {
    expect(roundResultButtonLabel(1)).toBe(copy.nextRound);
    expect(roundResultButtonLabel(4)).toBe(copy.nextRound);
    expect(roundResultButtonLabel(5)).toBe(copy.nextRound);
    expect(copy.nextRound).toBe("다음 라운드");
  });
});
