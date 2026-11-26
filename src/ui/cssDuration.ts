/** Read a CSS duration token as milliseconds. Vite may minify `700ms` to `.7s`. */
export function cssDurationMs(value: string, fallback = 0): number {
  const trimmed = value.trim();
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n)) return fallback;
  if (/ms$/i.test(trimmed)) return n;
  if (/s$/i.test(trimmed)) return n * 1000;
  return n;
}

export function tokenDurationMs(name: string, fallback = 0, root = document.documentElement): number {
  return cssDurationMs(getComputedStyle(root).getPropertyValue(name), fallback);
}
