import { describe, expect, it } from "vitest";
import {
  TEAM_NAME_COLUMN_GAP,
  TEAM_NAME_MIN_FONT_SIZE,
  TEAM_NAME_WRAP_LINE_HEIGHT,
  columnWidth,
  fitTeamName,
  teamNameAlignItems,
  wrapTeamName,
} from "./teamName.ts";

/** One em per character, close to Do Hyeon Hangul. */
function em(text: string, fontSize: number): number {
  return text.length * fontSize;
}

describe("columnWidth", () => {
  it("is the span from the name x to the next column, minus a 24px gap", () => {
    expect(columnWidth(300, 540)).toBe(216);
    expect(columnWidth(340, 540)).toBe(176);
    expect(TEAM_NAME_COLUMN_GAP).toBe(24);
  });
});

describe("fitTeamName", () => {
  it("keeps the designed size when a short name fits", () => {
    expect(fitTeamName("1팀", 176, 36, em)).toEqual({ fontSize: 36, lines: ["1팀"] });
  });

  it("shrinks a long name down to 40 when that still fits on one line", () => {
    // 8 glyphs at 48 need 384px, so a 400px cell keeps 48. A 360px cell shrinks to 45.
    expect(fitTeamName("가나다라마바사아", 400, 48, em)).toEqual({
      fontSize: 48,
      lines: ["가나다라마바사아"],
    });
    const shrunk = fitTeamName("가나다라마바사아", 360, 48, em);
    expect(shrunk.lines).toEqual(["가나다라마바사아"]);
    expect(shrunk.fontSize).toBeGreaterThanOrEqual(40);
    expect(shrunk.fontSize).toBeLessThanOrEqual(45);
    expect(em("가나다라마바사아", shrunk.fontSize)).toBeLessThanOrEqual(360);
  });

  it("wraps an 8-character name at 40 into two 4-character lines in a 180px cell", () => {
    const fit = fitTeamName("가나다라마바사아", 180, 36, em);
    expect(TEAM_NAME_MIN_FONT_SIZE).toBe(40);
    expect(TEAM_NAME_WRAP_LINE_HEIGHT).toBe(48);
    expect(fit.fontSize).toBe(40);
    expect(fit.lines).toEqual(["가나다라", "마바사아"]);
    expect(em("가나다라", 40)).toBe(160);
    expect(em("가나다라", 40)).toBeLessThanOrEqual(180);
  });
});

describe("wrapTeamName", () => {
  it("picks an even split when both lines fit", () => {
    expect(wrapTeamName("가나다라마바사아", 180, 40, em)).toEqual(["가나다라", "마바사아"]);
    // 7 glyphs would fit in a 216px cell at ~31px each, but 4+4 is even and also fits.
    const narrow = (text: string, size: number) => text.length * 30.75;
    expect(wrapTeamName("가나다라마바사아", 216, 40, narrow)).toEqual(["가나다라", "마바사아"]);
    expect(wrapTeamName("ABC", 100, 40, em)).toEqual(["AB", "C"]);
  });
});

describe("teamNameAlignItems", () => {
  it("top-aligns a single line in a table row so it shares the label and score line", () => {
    expect(teamNameAlignItems("row", 1)).toBe("flex-start");
  });

  it("centers a wrapped name in the row and keeps other placements centered", () => {
    expect(teamNameAlignItems("row", 2)).toBe("center");
    expect(teamNameAlignItems("center", 1)).toBe("center");
    expect(teamNameAlignItems("center", 2)).toBe("center");
  });
});
