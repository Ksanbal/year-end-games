import { describe, expect, it } from "vitest";
import { cssDurationMs } from "./cssDuration.ts";

describe("cssDurationMs", () => {
  it("reads millisecond and second units, including minified values", () => {
    expect(cssDurationMs("700ms")).toBe(700);
    expect(cssDurationMs(" 350ms")).toBe(350);
    expect(cssDurationMs(".7s")).toBe(700);
    expect(cssDurationMs("0.7s")).toBe(700);
    expect(cssDurationMs(".35s")).toBe(350);
    expect(cssDurationMs("1.2s")).toBe(1200);
    expect(cssDurationMs("0ms")).toBe(0);
    expect(cssDurationMs("0s")).toBe(0);
  });

  it("falls back when the value is missing or not a duration", () => {
    expect(cssDurationMs("", 150)).toBe(150);
    expect(cssDurationMs("none", 150)).toBe(150);
  });
});
