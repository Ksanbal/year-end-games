import { useLayoutEffect, useState } from "react";
import { measureDisplayWidth, whenFontsReady } from "../textMeasure.ts";

/** header.title. The smallest size before a name wraps to two lines. */
export const TEAM_NAME_MIN_FONT_SIZE = 40;
/** Line height used when a name wraps to two lines. */
export const TEAM_NAME_WRAP_LINE_HEIGHT = 48;
/** Minimum gap between a name cell and the next column. */
export const TEAM_NAME_COLUMN_GAP = 24;

export type TeamNameFit = {
  fontSize: number;
  lines: string[];
};

export function columnWidth(nameX: number, nextColumnX: number, gap = TEAM_NAME_COLUMN_GAP): number {
  return Math.max(0, nextColumnX - nameX - gap);
}

/**
 * Team-name overflow treatment for the 10/08/09/shuffle/11 screens.
 * 1. Keep the designed size when the name fits on one line.
 * 2. Otherwise shrink, not below 40.
 * 3. If 40 still overflows, wrap on character boundaries, at most two lines
 *    with a 48px line height. No ellipsis. Swap this function if the
 *    treatment changes. Widths are measured, not hardcoded.
 *
 * When the designed size is already below 40 and the name overflows,
 * wrapping uses 40 (the specified wrap size) rather than shrinking further.
 */
export function fitTeamName(
  text: string,
  cellWidth: number,
  startFontSize: number,
  measure: (text: string, fontSize: number) => number,
): TeamNameFit {
  if (cellWidth <= 0 || text.length === 0) {
    return { fontSize: startFontSize, lines: [text] };
  }
  if (measure(text, startFontSize) <= cellWidth) {
    return { fontSize: startFontSize, lines: [text] };
  }

  const floor = TEAM_NAME_MIN_FONT_SIZE;
  if (startFontSize > floor) {
    const fitted = shrinkToWidth(text, cellWidth, floor, startFontSize, measure);
    if (fitted !== null) return { fontSize: fitted, lines: [text] };
  }

  return { fontSize: floor, lines: wrapTeamName(text, cellWidth, floor, measure) };
}

function shrinkToWidth(
  text: string,
  cellWidth: number,
  floor: number,
  start: number,
  measure: (text: string, fontSize: number) => number,
): number | null {
  if (measure(text, floor) <= cellWidth) {
    let lo = floor;
    let hi = start;
    let best = floor;
    while (hi - lo > 0.25) {
      const mid = (lo + hi) / 2;
      if (measure(text, mid) <= cellWidth) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return best;
  }
  return null;
}

/**
 * Wrap into at most two lines on character boundaries.
 * When several splits fit, pick the most even one so a wide cell
 * does not leave a single character on the second line.
 */
export function wrapTeamName(
  text: string,
  cellWidth: number,
  fontSize: number,
  measure: (text: string, fontSize: number) => number,
): string[] {
  if (text.length <= 1 || measure(text, fontSize) <= cellWidth) return [text];
  const fits: number[] = [];
  for (let i = 1; i <= text.length - 1; i += 1) {
    if (
      measure(text.slice(0, i), fontSize) <= cellWidth &&
      measure(text.slice(i), fontSize) <= cellWidth
    ) {
      fits.push(i);
    }
  }
  if (fits.length > 0) {
    const mid = text.length / 2;
    const split = fits.reduce((best, i) => (Math.abs(i - mid) <= Math.abs(best - mid) ? i : best));
    return [text.slice(0, split), text.slice(split)];
  }
  let split = 1;
  for (let i = 1; i <= text.length - 1; i += 1) {
    if (measure(text.slice(0, i), fontSize) <= cellWidth) split = i;
    else break;
  }
  return [text.slice(0, split), text.slice(split)];
}

export function useTeamNameFit(
  name: string,
  cellWidth: number,
  startFontSize: number,
): TeamNameFit & { ready: boolean } {
  const [fit, setFit] = useState<TeamNameFit>({ fontSize: startFontSize, lines: [name] });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;
    setReady(false);
    const run = async () => {
      await whenFontsReady();
      if (cancelled) return;
      setFit(fitTeamName(name, cellWidth, startFontSize, measureDisplayWidth));
      setReady(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [name, cellWidth, startFontSize]);

  return { ...fit, ready };
}

export type TeamNameVAlign = "center" | "row";

/**
 * Table rows keep a single-line name at the top of the cell so it shares
 * the label and score line. A wrapped name stays vertically centered in
 * the row, which does not grow.
 */
export function teamNameAlignItems(vAlign: TeamNameVAlign, lineCount: number): "center" | "flex-start" {
  return vAlign === "row" && lineCount < 2 ? "flex-start" : "center";
}
