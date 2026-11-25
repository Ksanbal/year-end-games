import { describe, expect, it } from "vitest";
import {
  LEVER_MAX_PX,
  LEVER_SPIN_THRESHOLD_PX,
  WIN_PAYOUT_MULTIPLIER,
  allReelsSettledAt,
  canNudge,
  clampBet,
  coinsAfter,
  defaultBet,
  displayCoins,
  isAllIn,
  isJackpot,
  isZeroCoinLoss,
  openingView,
  showEmptyCoin,
  knobCenterY,
  leverPullPx,
  leverShouldSpin,
  nudgeBet,
  outcomeForStops,
  pickSymbol,
  reelStopAt,
  rollStops,
  topicParticle,
  type ReelStops,
  type SlotView,
} from "./logic.ts";

describe("clampBet / nudgeBet", () => {
  it("keeps a bet an integer from 1 through the team's coins", () => {
    expect(clampBet(20, 170)).toBe(20);
    expect(clampBet(1, 170)).toBe(1);
    expect(clampBet(170, 170)).toBe(170);
    expect(clampBet(0, 170)).toBe(1);
    expect(clampBet(-8, 170)).toBe(1);
    expect(clampBet(999, 170)).toBe(170);
    expect(clampBet(4.9, 170)).toBe(4);
  });

  it("returns 0 when the team has no coins to bet", () => {
    expect(clampBet(1, 0)).toBe(0);
    expect(defaultBet(0)).toBe(0);
    expect(defaultBet(90)).toBe(1);
  });

  it("steps by 1 or 10 and stops at the ends", () => {
    expect(nudgeBet(1, -1, 170)).toBe(1);
    expect(nudgeBet(1, -10, 170)).toBe(1);
    expect(nudgeBet(8, -10, 170)).toBe(1);
    expect(nudgeBet(20, 10, 170)).toBe(30);
    expect(nudgeBet(165, 10, 170)).toBe(170);
    expect(canNudge(1, -1, 170)).toBe(false);
    expect(canNudge(1, 1, 170)).toBe(true);
    expect(canNudge(170, 1, 170)).toBe(false);
    expect(canNudge(160, 10, 170)).toBe(true);
    expect(isAllIn(170, 170)).toBe(true);
    expect(isAllIn(20, 170)).toBe(false);
    expect(isAllIn(0, 0)).toBe(false);
  });
});

describe("payout", () => {
  const sevens: ReelStops = ["seven", "seven", "seven"];
  const miss: ReelStops = ["seven", "cherry", "bell"];

  it("treats only 777 as a win and pays 10× the bet including the stake", () => {
    expect(isJackpot(sevens)).toBe(true);
    expect(isJackpot(miss)).toBe(false);
    expect(isJackpot(["seven", "seven", "cherry"])).toBe(false);
    expect(outcomeForStops(20, sevens)).toEqual({ kind: "win", bet: 20 });
    expect(outcomeForStops(20, miss)).toEqual({ kind: "lose", bet: 20 });
    expect(coinsAfter(170, { kind: "win", bet: 20 })).toBe(350);
    expect(coinsAfter(170, { kind: "lose", bet: 20 })).toBe(150);
    expect(coinsAfter(190, { kind: "skip" })).toBe(190);
    expect(WIN_PAYOUT_MULTIPLIER).toBe(10);
    expect(170 - 20 + 20 * 10).toBe(350);
  });

  it("shows starting coins until the reels spin, then the post-bet or post-payout total", () => {
    const betting: SlotView = { kind: "betting", bet: 20, confirmAllIn: false };
    const ready: SlotView = { kind: "ready", bet: 20 };
    const spinning: SlotView = { kind: "spinning", bet: 20, stops: sevens };
    const win: SlotView = { kind: "result", outcome: { kind: "win", bet: 20 }, stops: sevens };
    const lose: SlotView = { kind: "result", outcome: { kind: "lose", bet: 20 }, stops: miss };
    const skip: SlotView = {
      kind: "result",
      outcome: { kind: "skip" },
      stops: ["dash", "dash", "dash"],
    };
    expect(displayCoins(170, betting)).toBe(170);
    expect(displayCoins(170, ready)).toBe(170);
    expect(displayCoins(170, spinning)).toBe(150);
    expect(displayCoins(170, win)).toBe(350);
    expect(displayCoins(170, lose)).toBe(150);
    expect(displayCoins(190, skip)).toBe(190);
  });
});

describe("lever threshold", () => {
  it("spins only when the downward pull reaches 168px of the 280px throw", () => {
    expect(LEVER_SPIN_THRESHOLD_PX).toBe(168);
    expect(LEVER_MAX_PX).toBe(280);
    expect(168 / 280).toBeCloseTo(0.6);
    expect(leverShouldSpin(167)).toBe(false);
    expect(leverShouldSpin(168)).toBe(true);
    expect(leverShouldSpin(280)).toBe(true);
    expect(leverPullPx(300, 250)).toBe(0);
    expect(leverPullPx(300, 400)).toBe(100);
    expect(leverPullPx(300, 700)).toBe(280);
    expect(knobCenterY(0)).toBe(300);
    expect(knobCenterY(280)).toBe(580);
  });
});

describe("reel odds", () => {
  it("picks each symbol with equal 1/3 weight and 777 in 1/27 of full rolls", () => {
    expect(pickSymbol(() => 0)).toBe("seven");
    expect(pickSymbol(() => 1 / 3 - 1e-9)).toBe("seven");
    expect(pickSymbol(() => 1 / 3)).toBe("cherry");
    expect(pickSymbol(() => 2 / 3 - 1e-9)).toBe("cherry");
    expect(pickSymbol(() => 2 / 3)).toBe("bell");
    expect(pickSymbol(() => 0.999)).toBe("bell");
    expect(pickSymbol(() => 1)).toBe("bell");

    let jackpots = 0;
    const period = 27;
    for (let i = 0; i < period; i++) {
      let step = 0;
      const random = () => {
        const lane = Math.floor(i / 9);
        const mid = Math.floor(i / 3) % 3;
        const right = i % 3;
        const value = [lane, mid, right][step] / 3;
        step += 1;
        return value;
      };
      if (isJackpot(rollStops(random))) jackpots += 1;
    }
    expect(jackpots).toBe(1);
  });

  it("stops the left reel at 3s and the others one second apart", () => {
    expect(reelStopAt(0)).toBe(3000);
    expect(reelStopAt(1)).toBe(4000);
    expect(reelStopAt(2)).toBe(5000);
    expect(allReelsSettledAt()).toBe(5400);
  });
});

describe("topicParticle", () => {
  it("uses 은 after a 받침 and 는 after an open syllable", () => {
    expect(topicParticle("1팀")).toBe("은");
    expect(topicParticle("2팀")).toBe("은");
    expect(topicParticle("코리아")).toBe("는");
  });
});

describe("zero-coin slot turn", () => {
  it("opens on the skip result when the team already has 0 coins, with no betting UI", () => {
    expect(openingView(0)).toEqual({
      kind: "result",
      outcome: { kind: "skip" },
      stops: ["dash", "dash", "dash"],
    });
    expect(openingView(170)).toEqual({ kind: "betting", bet: 1, confirmAllIn: false });
  });

  it("treats an all-in loss as a zero-coin result and shows the empty coin at 0", () => {
    expect(isZeroCoinLoss(170, { kind: "lose", bet: 170 })).toBe(true);
    expect(isZeroCoinLoss(170, { kind: "lose", bet: 20 })).toBe(false);
    expect(isZeroCoinLoss(170, { kind: "win", bet: 170 })).toBe(false);
    expect(isZeroCoinLoss(170, { kind: "skip" })).toBe(false);
    expect(displayCoins(170, { kind: "result", outcome: { kind: "lose", bet: 170 }, stops: ["seven", "cherry", "bell"] })).toBe(0);
    expect(showEmptyCoin(0)).toBe(true);
    expect(showEmptyCoin(1)).toBe(false);
  });
});
