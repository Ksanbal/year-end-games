// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { copy } from "../../copy.ts";
import type { GameContext } from "../types.ts";
import type { TurnResult } from "../../state/types.ts";
import { TimerPlay } from "./TimerPlay.tsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const context: GameContext = {
  names: ["1팀", "2팀", "3팀"],
  team: 0,
  turnIndex: 0,
  coins: [0, 0, 0],
};

function play(gameId: 4 | 5, onFinish: (result: TurnResult) => void = () => {}) {
  return createElement(TimerPlay, { gameId, context, onFinish });
}

describe("TimerPlay start button", () => {
  it("does not count before 카운트 시작 is pressed", async () => {
    const view = render(play(4));
    expect(view.getByRole("button", { name: copy.startCount })).toBeTruthy();
    expect(copy.startCount).toBe("카운트 시작");
    expect(view.getByText("0.000")).toBeTruthy();
    expect(view.queryByRole("button", { name: "멈춤" })).toBeNull();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
    expect(view.getByText("0.000")).toBeTruthy();
    expect(view.getByRole("button", { name: "카운트 시작" })).toBeTruthy();
  });

  it("starts counting from the press and keeps 멈춤 while running", async () => {
    let now = 10_000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const pending: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      pending.push(cb);
      return pending.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const view = render(play(4));
    await userEvent.click(view.getByRole("button", { name: "카운트 시작" }));
    expect(view.getByRole("button", { name: "멈춤" })).toBeTruthy();
    expect(view.queryByRole("button", { name: "카운트 시작" })).toBeNull();

    act(() => {
      now = 10_250;
      const batch = pending.splice(0);
      for (const cb of batch) cb(now);
    });
    expect(view.getByText("0.250")).toBeTruthy();
  });

  it("still stops on 멈춤 and reports the elapsed time", async () => {
    let now = 10_000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const pending: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      pending.push(cb);
      return pending.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const finished: TurnResult[] = [];
    const view = render(play(4, (result) => finished.push(result)));
    await userEvent.click(view.getByRole("button", { name: "카운트 시작" }));
    act(() => {
      now = 10_137;
      const batch = pending.splice(0);
      for (const cb of batch) cb(now);
    });
    await userEvent.click(view.getByRole("button", { name: "멈춤" }));
    expect(view.getByText("10초와 차이")).toBeTruthy();
    expect(view.getByText("9.863초")).toBeTruthy();
    expect(view.getByText("멈춘 시각 0.137초")).toBeTruthy();
    await userEvent.click(view.getByRole("button", { name: copy.revealResults }));
    expect(finished).toEqual([{ kind: "timeDiff", stoppedAtMs: 137, autoStopped: false }]);
  });

  it("shows 카운트 시작 and hides the clock for game 5 until the press", () => {
    const view = render(play(5));
    expect(view.getByRole("button", { name: "카운트 시작" })).toBeTruthy();
    expect(view.getByText("숫자는 가려져 있어요")).toBeTruthy();
    expect(view.queryByText("0.000")).toBeNull();
    expect(view.queryByRole("button", { name: "멈춤" })).toBeNull();
  });
});
