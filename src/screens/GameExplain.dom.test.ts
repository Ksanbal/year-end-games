// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameExplain } from "./GameExplain.tsx";
import { copy } from "../copy.ts";

afterEach(cleanup);
describe("explanation screen reduced motion", () => {
  it("shows the requested static pose immediately and advances on the button", () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }) });
    const next = vi.fn();
    const view = render(createElement(GameExplain, { round: 2, onNext: next }));
    expect(view.container.querySelector(".explain-demo-status")?.getAttribute("data-frame")).toBe("2");
    expect(view.container.querySelector(".explain-demo-status")?.getAttribute("data-reduced")).toBe("true");
    fireEvent.click(view.getByRole("button", { name: copy.goPlayGame }));
    expect(next).toHaveBeenCalledOnce();
  });
});
