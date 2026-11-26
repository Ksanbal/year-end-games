import { describe, expect, it } from "vitest";
import { COIN_ASPECT, pickCoinAsset } from "./coinAsset.ts";

describe("pickCoinAsset", () => {
  it("uses the large file whose designed size is closest, at 72 and above", () => {
    expect(pickCoinAsset(72).name).toBe("coin-gold-large-72");
    expect(pickCoinAsset(86).name).toBe("coin-gold-large-86");
    expect(pickCoinAsset(108).name).toBe("coin-gold-large-108");
    expect(pickCoinAsset(80).name).toBe("coin-gold-large-86");
    expect(pickCoinAsset(100).name).toBe("coin-gold-large-108");
  });

  it("uses the small file whose designed size is closest, below 72", () => {
    expect(pickCoinAsset(58).name).toBe("coin-gold-small-58");
    expect(pickCoinAsset(52).name).toBe("coin-gold-small-52");
    expect(pickCoinAsset(36).name).toBe("coin-gold-small-36");
    expect(pickCoinAsset(40).name).toBe("coin-gold-small-36");
    expect(pickCoinAsset(55).name).toBe("coin-gold-small-58");
  });

  it("uses the empty 52 file when the coin is spent", () => {
    expect(pickCoinAsset(52, true).name).toBe("coin-empty-52");
    expect(pickCoinAsset(108, true).name).toBe("coin-empty-52");
  });

  it("points srcset at the 2x and 3x files", () => {
    const asset = pickCoinAsset(72);
    expect(asset.src).toBe("/coins/coin-gold-large-72@2x.png");
    expect(asset.srcSet).toBe("/coins/coin-gold-large-72@2x.png 2x, /coins/coin-gold-large-72@3x.png 3x");
  });
});

describe("COIN_ASPECT", () => {
  it("keeps the face-plus-rim canvas at 1:1.12", () => {
    expect(COIN_ASPECT).toBe(1.12);
    expect(72 * COIN_ASPECT).toBeCloseTo(80.64);
    expect(52 * COIN_ASPECT).toBeCloseTo(58.24);
  });
});
