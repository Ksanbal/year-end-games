import { describe, expect, it } from "vitest";
import { copy } from "../copy.ts";
import {
  FINAL_TITLE_COIN_CLUSTER,
  FINAL_TITLE_FONT_SIZE,
  FINAL_TITLE_MIN_FONT_SIZE,
  FINAL_TITLE_SAFE_WIDTH,
  fitFinalTitle,
  fittedTitleWidth,
} from "./finalTitle.ts";

function expectFitsSafe(textWidthAtBase: number) {
  const fit = fitFinalTitle(textWidthAtBase);
  const width = fittedTitleWidth(textWidthAtBase, fit);
  expect(fit.fontSize).toBeGreaterThanOrEqual(FINAL_TITLE_MIN_FONT_SIZE);
  expect(fit.fontSize).toBeLessThanOrEqual(FINAL_TITLE_FONT_SIZE);
  expect(width).toBeLessThanOrEqual(FINAL_TITLE_SAFE_WIDTH + 1e-6);
  if (fit.showCoins) {
    expect(fit.fontSize).toBeGreaterThanOrEqual(FINAL_TITLE_MIN_FONT_SIZE);
  } else {
    expect(fit.fontSize).toBe(FINAL_TITLE_MIN_FONT_SIZE);
  }
  return fit;
}

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

  it("keeps 80px and the coins for a three-way tie with 5-character names", () => {
    // Measured at Do Hyeon 80 on the live 10-3 probe.
    const textWidth = 1513.7;
    const fit = expectFitsSafe(textWidth);
    expect(fit).toEqual({ fontSize: 80, showCoins: true });
  });

  it("shrinks the text, keeps the coins, and stays inside the safe width for 6- and 7-character three-way ties", () => {
    // Measured at Do Hyeon 80 from the live probes (scaled width / (font/80)).
    const six = 1561 * (80 / 73.5632);
    const seven = 1578.7 * (80 / 67.101);
    const sixFit = expectFitsSafe(six);
    const sevenFit = expectFitsSafe(seven);
    expect(sixFit.showCoins).toBe(true);
    expect(sevenFit.showCoins).toBe(true);
    expect(sixFit.fontSize).toBeLessThan(80);
    expect(sevenFit.fontSize).toBeLessThan(80);
    expect(sixFit.fontSize).toBeGreaterThanOrEqual(64);
    expect(sevenFit.fontSize).toBeGreaterThanOrEqual(64);
  });

  it("locks to 64px and hides the coins for three 8-character names", () => {
    const textWidth = 2094;
    const fit = expectFitsSafe(textWidth);
    expect(FINAL_TITLE_COIN_CLUSTER).toBe(216);
    expect(FINAL_TITLE_SAFE_WIDTH).toBe(1760);
    expect(textWidth + FINAL_TITLE_COIN_CLUSTER).toBe(2310);
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
