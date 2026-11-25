import { describe, expect, it } from "vitest";
import { copy } from "./copy.ts";

describe("finalTiedChampion", () => {
  it("joins the first-place team names with a middle dot after the confirmed prefix", () => {
    expect(copy.finalTiedChampion(["1팀", "2팀"])).toBe("최종 공동 1등 1팀 · 2팀");
    expect(copy.finalTiedChampion(["1팀", "2팀", "3팀"])).toBe("최종 공동 1등 1팀 · 2팀 · 3팀");
    expect(copy.finalTiedChampion(["청팀", "백팀"])).toBe("최종 공동 1등 청팀 · 백팀");
  });
});
