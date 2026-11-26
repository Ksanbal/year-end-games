/** Gold coin PNG selection. Canvas is d × 1.12d; the face sits in the d×d box. */

export const COIN_ASPECT = 1.12;
export const COIN_LARGE_SIZES = [108, 86, 72] as const;
export const COIN_SMALL_SIZES = [58, 52, 36] as const;

export type CoinAsset = {
  /** File stem, e.g. coin-gold-large-72. */
  name: string;
  src: string;
  srcSet: string;
  /** Designed face diameter in px that the file was rendered for. */
  pt: number;
};

const BASE = "/coins";

export function pickCoinAsset(size: number, empty = false): CoinAsset {
  if (empty) return file("coin-empty-52", 52);
  if (size >= 72) {
    const pt = closest(size, COIN_LARGE_SIZES);
    return file(`coin-gold-large-${pt}`, pt);
  }
  const pt = closest(size, COIN_SMALL_SIZES);
  return file(`coin-gold-small-${pt}`, pt);
}

export function coinImageHrefs(): string[] {
  const names = [
    "coin-empty-52",
    ...COIN_LARGE_SIZES.map((pt) => `coin-gold-large-${pt}`),
    ...COIN_SMALL_SIZES.map((pt) => `coin-gold-small-${pt}`),
  ];
  return names.flatMap((name) => [`${BASE}/${name}@2x.png`, `${BASE}/${name}@3x.png`]);
}

export function preloadCoinImages(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  return Promise.all(coinImageHrefs().map(decodeImage)).then(() => undefined);
}

function closest(size: number, series: readonly number[]): number {
  return series.reduce((best, pt) => (Math.abs(pt - size) < Math.abs(best - size) ? pt : best));
}

function file(name: string, pt: number): CoinAsset {
  const src = `${BASE}/${name}@2x.png`;
  return {
    name,
    src,
    srcSet: `${BASE}/${name}@2x.png 2x, ${BASE}/${name}@3x.png 3x`,
    pt,
  };
}

function decodeImage(href: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = href;
  });
}
