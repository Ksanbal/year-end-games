import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "tokens.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`missing token ${name}`);
  return match[1].trim();
}

describe("design tokens", () => {
  it("uses the darker highlight stroke on every highlighted row", () => {
    expect(token("--color-stroke-highlight")).toBe("#9A6A08");
  });

  it("defines the used-surface colors for the empty coin", () => {
    expect(token("--color-surface-used")).toBe("#EEF3FA");
    expect(token("--color-stroke-used")).toBe("#9AA9C4");
    expect(token("--color-text-used")).toBe("#5B6A85");
  });
});
