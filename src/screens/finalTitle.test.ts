import { describe, expect, it } from "vitest";
import { copy } from "../copy.ts";
import {
  FINAL_TITLE_COIN_CLUSTER,
  FINAL_TITLE_FONT_SIZE,
  FINAL_TITLE_MIN_FONT_SIZE,
  FINAL_TITLE_SAFE_WIDTH,
  fitFinalTitle,
} from "./finalTitle.ts";

describe("fitFinalTitle", () => {
  it("keeps 80px and the coins for default two-team and three-team titles", () => {
    // Muse reference widths at Do Hyeon 80, used only as policy inputs.
    expect(fitFinalTitle(702)).toEqual({ fontSize: 80, showCoins: true });
    expect(fitFinalTitle(911)).toEqual({ fontSize: 80, showCoins: true });
    expect(702 + FINAL_TITLE_COIN_CLUSTER).toBe(918);
    expect(911 + FINAL_TITLE_COIN_CLUSTER).toBe(1127);
    expect(1127).toBeLessThanOrEqual(FINAL_TITLE_SAFE_WIDTH);
  });

  it("keeps 80px and the coins for a two-team tie with 8-character names", () => {
    expect(fitFinalTitle(1496)).toEqual({ fontSize: 80, showCoins: true });
    expect(1496 + FINAL_TITLE_COIN_CLUSTER).toBe(1712);
    expect(1712).toBeLessThanOrEqual(FINAL_TITLE_SAFE_WIDTH);
  });

  it("locks to 64px and hides the coins for three 8-character names", () => {
    const textWidth = 2094;
    const fit = fitFinalTitle(textWidth);
    expect(FINAL_TITLE_COIN_CLUSTER).toBe(216);
    expect(FINAL_TITLE_SAFE_WIDTH).toBe(1760);
    expect(textWidth + FINAL_TITLE_COIN_CLUSTER).toBe(2310);
    const scaled = FINAL_TITLE_FONT_SIZE * (FINAL_TITLE_SAFE_WIDTH / 2310);
    expect(scaled).toBeLessThan(FINAL_TITLE_MIN_FONT_SIZE);
    expect(fit).toEqual({ fontSize: 64, showCoins: false });
    const atMin = textWidth * (64 / 80);
    expect(atMin + FINAL_TITLE_COIN_CLUSTER).toBeGreaterThan(FINAL_TITLE_SAFE_WIDTH);
    expect(atMin).toBeLessThanOrEqual(FINAL_TITLE_SAFE_WIDTH);
  });

  it("builds the three-team 8-character title with the confirmed pattern", () => {
    const names = ["가나다라마바사아", "가나다라마바사자", "가나다라마바사차"];
    expect(names.every((name) => name.length === 8)).toBe(true);
    expect(copy.finalTiedChampion(names)).toBe(
      "최종 공동 1등 가나다라마바사아 · 가나다라마바사자 · 가나다라마바사차",
    );
  });
});
