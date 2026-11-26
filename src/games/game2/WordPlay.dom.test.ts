// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { GameContext } from "../types.ts";
import { idiomFixture } from "../game3/fixtures.ts";
import { wordFixture } from "./fixtures.ts";
import { WordPlay } from "./WordPlay.tsx";

afterEach(cleanup);

const context: GameContext = {
  names: ["1팀", "2팀", "3팀"],
  team: 0,
  turnIndex: 0,
  coins: [0, 0, 0],
};

function play(gameId: 2 | 3, fixture: NonNullable<ReturnType<typeof wordFixture>>) {
  return createElement(WordPlay, {
    gameId,
    context,
    onFinish: () => {},
    problems: [fixture.problem],
    fixture,
    persistUsed: false,
  });
}

describe("WordPlay HUD", () => {
  it("shows the game 3 meaning and remaining time without score or limit", () => {
    const fixture = idiomFixture("04-1");
    if (!fixture?.problem.meaning) throw new Error("Missing game 3 meaning fixture");
    const view = render(play(3, fixture));

    expect(view.getByText("뜻풀이")).toBeTruthy();
    expect(view.getByText(fixture.problem.meaning)).toBeTruthy();
    expect(view.getByText("남은 시간 0:52")).toBeTruthy();
    expect(view.queryByText(/맞힌 문제|제한/)).toBeNull();
  });

  it("shows remaining time without a meaning, score, or limit in game 2", () => {
    const fixture = wordFixture("03-1");
    if (!fixture) throw new Error("Missing game 2 fixture");
    const view = render(play(2, fixture));

    expect(view.getByText("남은 시간 0:52")).toBeTruthy();
    expect(view.queryByText(/뜻풀이|맞힌 문제|제한/)).toBeNull();
  });

  it("keeps the score label in the result overlay", () => {
    const fixture = wordFixture("03-3");
    if (!fixture) throw new Error("Missing result fixture");
    const view = render(play(2, fixture));

    expect(view.getByText("맞힌 문제")).toBeTruthy();
    expect(view.getByText("12")).toBeTruthy();
  });

  it("renders the longest meaning on one line and uses the r17 typography tokens", () => {
    const fixture = idiomFixture("04-1-long");
    if (!fixture?.problem.meaning) throw new Error("Missing longest meaning fixture");
    expect(fixture.problem.answer).toBe("구사일생");
    expect(fixture.problem.meaning.length).toBe(51);
    const view = render(play(3, fixture));
    const meaning = view.container.querySelector(".word-meaning");
    expect(meaning?.textContent).toBe(fixture.problem.meaning);
    expect(meaning?.className).toBe("word-meaning");
    expect(view.queryByText(/맞힌 문제|제한/)).toBeNull();
    const css = readFileSync("src/games/game2/word.css", "utf8");
    expect(css).toMatch(/--word-remain-top:\s*36px/);
    expect(css).toMatch(/--word-remain-right:\s*80px/);
    expect(css).toMatch(/--word-meaning-label-size:\s*30px/);
    expect(css).toMatch(/--word-meaning-label-top:\s*236px/);
    expect(css).toMatch(/--word-meaning-size:\s*44px/);
    expect(css).toMatch(/--word-meaning-line-height:\s*53px/);
    expect(css).toMatch(/--word-meaning-top:\s*280px/);
    expect(css).toMatch(/\.word-meaning[\s\S]*?font-family:\s*var\(--font-display\)/);
    expect(css).toMatch(/\.word-meaning[\s\S]*?white-space:\s*nowrap/);
    expect(css).not.toContain("is-tight");
  });
});
