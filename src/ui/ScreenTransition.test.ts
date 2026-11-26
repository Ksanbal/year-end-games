// @vitest-environment jsdom
import { createElement, useEffect } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScreenTransition } from "./ScreenTransition.tsx";

afterEach(() => { cleanup(); vi.useRealTimers(); document.documentElement.style.removeProperty("--motion-screen-crossfade"); });

describe("screen cross-fade", () => {
  it("starts the new screen immediately and leaves only an inert visual copy", () => {
    vi.useFakeTimers();
    document.documentElement.style.setProperty("--motion-screen-crossfade", "150ms");
    const ended = vi.fn();
    const clicked = vi.fn();
    function Old() {
      useEffect(() => () => ended(), []);
      return createElement("button", { onClick: clicked }, "old");
    }
    const view = render(createElement(ScreenTransition, { screenKey: "old", children: createElement(Old) }));
    expect(view.container.querySelector(".is-entering")).toBeNull();
    view.rerender(createElement(ScreenTransition, { screenKey: "new", children: createElement("button", null, "new") }));
    expect(ended).toHaveBeenCalledOnce();
    expect(view.getByText("new")).toBeTruthy();
    expect(view.container.querySelector(".is-entering")).toBeTruthy();
    const leaving = view.container.querySelector<HTMLElement>(".is-leaving");
    expect(leaving?.getAttribute("aria-hidden")).toBe("true");
    fireEvent.click(leaving!.querySelector("button")!);
    expect(clicked).not.toHaveBeenCalled();
    view.rerender(createElement(ScreenTransition, { screenKey: "new", children: createElement("button", null, "new") }));
    expect(view.container.querySelector(".is-entering")).toBeTruthy();
    expect(view.container.querySelector(".is-leaving")).toBeTruthy();
    act(() => vi.advanceTimersByTime(150));
    expect(view.container.querySelector(".is-leaving")).toBeNull();
    expect(view.container.querySelector(".is-entering")).toBeNull();
  });
});
