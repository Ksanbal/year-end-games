// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfettiBurst } from "./Confetti.tsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubMotion(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  }));
}

describe("ConfettiBurst", () => {
  it("skips the burst when the user prefers reduced motion", () => {
    stubMotion(true);
    const view = render(createElement(ConfettiBurst));
    expect(view.container.querySelector("canvas")).toBeNull();
  });

  it("renders a one-shot canvas burst when motion is allowed", () => {
    stubMotion(false);
    const view = render(createElement(ConfettiBurst));
    const canvas = view.container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute("width")).toBe("1920");
    expect(canvas?.getAttribute("height")).toBe("1080");
  });
});
