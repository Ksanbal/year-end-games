import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const tokensCss = readFileSync(join(dir, "tokens.css"), "utf8");
const canvasCss = readFileSync(join(dir, "../ui/canvas.css"), "utf8");
const chromeCss = readFileSync(join(dir, "../ui/chrome.css"), "utf8");
const screensCss = readFileSync(join(dir, "screens.css"), "utf8");

function firstToken(css: string, name: string): string {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`missing token ${name}`);
  return match[1].trim();
}

function reducedBlock(css: string): string {
  const parts = css.split("prefers-reduced-motion");
  if (parts.length < 2) throw new Error("missing prefers-reduced-motion block");
  return parts.slice(1).join("prefers-reduced-motion");
}

describe("design tokens", () => {
  it("uses the darker highlight stroke on every highlighted row", () => {
    expect(firstToken(tokensCss, "--color-stroke-highlight")).toBe("#9A6A08");
  });

  it("defines the used-surface colors for the empty coin", () => {
    expect(firstToken(tokensCss, "--color-surface-used")).toBe("#EEF3FA");
    expect(firstToken(tokensCss, "--color-stroke-used")).toBe("#9AA9C4");
    expect(firstToken(tokensCss, "--color-text-used")).toBe("#5B6A85");
  });
});

describe("motion tokens", () => {
  it("keeps press, screen, and shuffle timings in one place", () => {
    expect(firstToken(tokensCss, "--motion-press-duration")).toBe("120ms");
    expect(firstToken(tokensCss, "--motion-press-down-duration")).toBe("80ms");
    expect(firstToken(tokensCss, "--motion-press-scale")).toBe("0.96");
    expect(firstToken(tokensCss, "--motion-press-ease")).toBe("cubic-bezier(0, 0, 0.2, 1)");
    expect(firstToken(tokensCss, "--motion-screen-crossfade")).toBe("150ms");
    expect(firstToken(tokensCss, "--motion-screen-ease")).toBe("cubic-bezier(0, 0, 0.58, 1)");
    expect(firstToken(tokensCss, "--motion-shuffle-duration")).toBe("120ms");
    expect(firstToken(tokensCss, "--motion-shuffle-stagger")).toBe("80ms");
    expect(firstToken(tokensCss, "--motion-shuffle-ease")).toBe("ease-in-out");
  });

  it("disables the new motion when the user prefers reduced motion", () => {
    const reduced = reducedBlock(tokensCss);
    expect(firstToken(reduced, "--motion-press-duration")).toBe("0ms");
    expect(firstToken(reduced, "--motion-press-scale")).toBe("1");
    expect(firstToken(reduced, "--motion-screen-crossfade")).toBe("0ms");
    expect(firstToken(reduced, "--motion-shuffle-duration")).toBe("0ms");
    expect(firstToken(reduced, "--motion-shuffle-stagger")).toBe("0ms");

    expect(canvasCss).toContain("var(--motion-screen-crossfade)");
    expect(reducedBlock(screensCss)).toMatch(/animation:\s*none/);
    expect(chromeCss).toContain("var(--motion-press-duration)");
    expect(chromeCss).toContain("var(--motion-press-scale)");
  });
});
