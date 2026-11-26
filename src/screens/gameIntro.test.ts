import { describe, expect, it } from "vitest";
import { copy } from "../copy.ts";
import { gameIntroRows } from "./gameIntro.ts";

describe("gameIntroRows", () => {
  it("lists the five catalog games, then Destiny's Lever, with existing copy only", () => {
    const rows = gameIntroRows();
    expect(rows.map((row) => row.label)).toEqual([
      copy.roundLabel(1),
      copy.roundLabel(2),
      copy.roundLabel(3),
      copy.roundLabel(4),
      copy.roundLabel(5),
      copy.afterFiveRounds,
    ]);
    expect(rows.map((row) => row.name)).toEqual([
      "게임 1 · 운수 좋은 날",
      "게임 2 · 어디서 왔니",
      "게임 3 · 할아버지 말씀",
      "게임 4 · 딱 거기",
      "게임 5 · 눈 감고 셋 넷",
      copy.destinysLever,
    ]);
    expect(rows[5]?.showCoin).toBe(true);
    expect(rows.slice(0, 5).every((row) => !row.showCoin)).toBe(true);
  });
});
