// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameExplain } from "./GameExplain.tsx";
import { MINE_COUNT } from "../games/game1/board.ts";
import { SLOT_PAYOUT_MULTIPLIER } from "../games/catalog.ts";
import { copy } from "../copy.ts";

afterEach(cleanup);
describe("explanation screen reduced motion", () => {
  it("shows the requested static pose immediately and advances on the button", () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }) });
    const next = vi.fn();
    const view = render(createElement(GameExplain, { round: 2, onNext: next }));
    expect(view.container.querySelector(".explain-demo-status")?.getAttribute("data-frame")).toBe("2");
    expect(view.container.querySelector(".explain-demo-status")?.getAttribute("data-reduced")).toBe("true");
    view.rerender(createElement(GameExplain, { round: "slot", onNext: next }));
    expect(view.container.querySelector(".explain-demo-status")?.getAttribute("data-frame")).toBe("1");
    expect(view.container.querySelectorAll(".slot-strip")).toHaveLength(0);
    expect(view.container.querySelector(".slot-frame")).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: copy.goPlayGame }));
    expect(next).toHaveBeenCalledOnce();
  });
});

it("renders explanation counts from game constants", () => {
  const view = render(createElement(GameExplain, { round: 1, onNext: () => {} }));
  expect(view.container.querySelector(".explain-line")?.textContent).toBe(`지뢰 ${MINE_COUNT}개 · 한 번 누를 때 타일 하나 · 열린 타일마다 1점`);
  view.rerender(createElement(GameExplain, { round: "slot", onNext: () => {} }));
  expect(view.container.querySelector(".explain-line")?.textContent).toBe(`팀당 3회 · 777은 ${SLOT_PAYOUT_MULTIPLIER}배 · 체리 셋이나 종 셋은 2배`);
});

it("spins the demo reels during the loop and keeps the machine frame visible", () => {
  vi.useFakeTimers();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }) });
  for (const [name, value] of Object.entries({ transition: 350, "hold-1": 700, "hold-2": 800, "hold-3": 800, "hold-4": 1200, dissolve: 300 })) {
    document.documentElement.style.setProperty(`--motion-demo-${name}`, `${value}ms`);
  }
  const view = render(createElement(GameExplain, { round: "slot", onNext: () => {} }));
  expect(view.container.querySelectorAll(".slot-strip")).toHaveLength(0);
  act(() => vi.advanceTimersByTime(1050));
  expect(view.container.querySelectorAll(".slot-strip")).toHaveLength(3);
  expect(view.container.querySelector(".slot-frame")).toBeTruthy();
  act(() => vi.advanceTimersByTime(3 * 4850 - 1050));
  expect(view.container.querySelector(".explain-demo-status")?.getAttribute("data-finished")).toBe("true");
  expect(view.container.querySelector(".explain-demo-status")?.getAttribute("data-frame")).toBe("1");
  expect(view.container.querySelectorAll(".slot-strip")).toHaveLength(0);
  expect(view.container.querySelector(".slot-frame")).toBeTruthy();
  cleanup();
  vi.useRealTimers();
});
