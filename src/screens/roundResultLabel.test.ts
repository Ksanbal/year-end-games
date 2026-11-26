import { describe, expect, it } from "vitest";
import { copy } from "../copy.ts";
import { roundResultButtonLabel, roundResultButtonStyle } from "./roundResultLabel.ts";

describe("round result button", () => {
  it("keeps 다음 라운드 on rounds 1–4", () => {
    expect(roundResultButtonLabel(1)).toBe(copy.nextRound);
    expect(roundResultButtonLabel(4)).toBe(copy.nextRound);
    expect(copy.nextRound).toBe("다음 라운드");
    expect(roundResultButtonStyle(1)).toEqual({ left: 760, top: 900 });
  });

  it("uses 운명의 레버 시작 at 450px on the last round", () => {
    expect(roundResultButtonLabel(5)).toBe(copy.startDestinysLever);
    expect(copy.startDestinysLever).toBe("운명의 레버 시작");
    expect(roundResultButtonStyle(5)).toEqual({ left: 735, top: 900, width: 450 });
  });
});
