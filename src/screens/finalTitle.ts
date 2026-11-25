import { useLayoutEffect, useState } from "react";

/** Do Hyeon title.final. */
export const FINAL_TITLE_FONT_SIZE = 80;
/** Do Hyeon title.page. The smallest size before decorative coins are hidden. */
export const FINAL_TITLE_MIN_FONT_SIZE = 64;
export const FINAL_TITLE_LINE_HEIGHT = 96;
export const FINAL_TITLE_COIN_SIZE = 72;
export const FINAL_TITLE_COIN_GAP = 36;
/** Two 72px coins plus a 36px gap on each side of the title. */
export const FINAL_TITLE_COIN_CLUSTER =
  FINAL_TITLE_COIN_SIZE * 2 + FINAL_TITLE_COIN_GAP * 2;
export const FRAME_WIDTH = 1920;
/** Existing left/right page margin. */
export const SIDE_MARGIN = 80;
export const FINAL_TITLE_SAFE_WIDTH = FRAME_WIDTH - SIDE_MARGIN * 2;

export type FinalTitleFit = {
  fontSize: number;
  showCoins: boolean;
};

/**
 * Overflow treatment for a joint-winner final title (open-item 18).
 * Shrinks the 80px title proportionally so the title plus coin cluster
 * fits the safe width. If that would go below 64px, lock to 64px and hide
 * the coins when the cluster still overflows. Swap this function if the
 * treatment changes. Widths are measured, not hardcoded.
 */
export function fitFinalTitle(textWidthAtBase: number): FinalTitleFit {
  const withCoins = textWidthAtBase + FINAL_TITLE_COIN_CLUSTER;
  if (withCoins <= FINAL_TITLE_SAFE_WIDTH) {
    return { fontSize: FINAL_TITLE_FONT_SIZE, showCoins: true };
  }
  const scaled = FINAL_TITLE_FONT_SIZE * (FINAL_TITLE_SAFE_WIDTH / withCoins);
  if (scaled >= FINAL_TITLE_MIN_FONT_SIZE) {
    return { fontSize: scaled, showCoins: true };
  }
  const textAtMin = textWidthAtBase * (FINAL_TITLE_MIN_FONT_SIZE / FINAL_TITLE_FONT_SIZE);
  return {
    fontSize: FINAL_TITLE_MIN_FONT_SIZE,
    showCoins: textAtMin + FINAL_TITLE_COIN_CLUSTER <= FINAL_TITLE_SAFE_WIDTH,
  };
}

export function measureTitleWidth(text: string, fontSize: number): number {
  const el = document.createElement("span");
  el.className = "text-display";
  el.style.cssText = [
    "position:absolute",
    "left:-9999px",
    "top:0",
    "visibility:hidden",
    "white-space:nowrap",
    `font-size:${fontSize}px`,
    `line-height:${FINAL_TITLE_LINE_HEIGHT}px`,
  ].join(";");
  el.textContent = text;
  const host = document.querySelector(".canvas") ?? document.body;
  host.appendChild(el);
  const width = el.offsetWidth;
  el.remove();
  return width;
}

export function useFinalTitleFit(title: string, active: boolean): FinalTitleFit & { ready: boolean } {
  const [fit, setFit] = useState<FinalTitleFit>({
    fontSize: FINAL_TITLE_FONT_SIZE,
    showCoins: true,
  });
  const [ready, setReady] = useState(!active);

  useLayoutEffect(() => {
    if (!active) {
      setFit({ fontSize: FINAL_TITLE_FONT_SIZE, showCoins: true });
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);
    const run = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      if (cancelled) return;
      setFit(fitFinalTitle(measureTitleWidth(title, FINAL_TITLE_FONT_SIZE)));
      setReady(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [title, active]);

  return { ...fit, ready };
}
