
import { describe, expect, it } from "vitest";
import { applySlotOutcome, rankFinal, rankTeams, slotOrder, timeDeltaMs } from "./scoring.ts";
import type { TeamIndex, TurnResult } from "./types.ts";

function scores(
  values: [number, number, number],
): { team: TeamIndex; result: TurnResult }[] {
  return values.map((score, team) => ({
    team: team as TeamIndex,
    result: { kind: "score", score },
  }));
}

function times(
  values: [number, number, number],
): { team: TeamIndex; result: TurnResult }[] {
  return values.map((stoppedAtMs, team) => ({
    team: team as TeamIndex,
    result: { kind: "timeDiff", stoppedAtMs, autoStopped: stoppedAtMs >= 20_000 },
  }));
}

describe("rankTeams", () => {
  it("gives 50, 30, 10 coins for 1st, 2nd, 3rd", () => {
    const rows = rankTeams(scores([4, 12, 7]));
    expect(rows.map((r) => ({ team: r.team, rank: r.rank, tied: r.tied, coins: r.coins }))).toEqual([
      { team: 1, rank: 1, tied: false, coins: 50 },
      { team: 2, rank: 2, tied: false, coins: 30 },
      { team: 0, rank: 3, tied: false, coins: 10 },
    ]);
  });

  it("gives joint 1st the same coins and makes the next team 3rd", () => {
    const rows = rankTeams(scores([4, 9, 9]));
    expect(rows.map((r) => ({ team: r.team, rank: r.rank, tied: r.tied, coins: r.coins }))).toEqual([
      { team: 1, rank: 1, tied: true, coins: 50 },
      { team: 2, rank: 1, tied: true, coins: 50 },
      { team: 0, rank: 3, tied: false, coins: 10 },
    ]);
  });

  it("gives all three teams joint 1st and 50 coins when scores match", () => {
    const rows = rankTeams(scores([8, 8, 8]));
    expect(rows.every((r) => r.rank === 1 && r.tied && r.coins === 50)).toBe(true);
  });

  it("ranks a unique 1st and a joint 2nd", () => {
    const rows = rankTeams(scores([5, 9, 5]));
    expect(rows.map((r) => ({ team: r.team, rank: r.rank, coins: r.coins }))).toEqual([
      { team: 1, rank: 1, coins: 50 },
      { team: 0, rank: 2, coins: 30 },
      { team: 2, rank: 2, coins: 30 },
    ]);
  });

  it("ranks 10-second games by absolute difference, treating an auto-stop as 10s off", () => {
    expect(timeDeltaMs({ stoppedAtMs: 20_000 })).toBe(10_000);
    const rows = rankTeams(times([10_100, 9_900, 20_000]));
    expect(rows.map((r) => ({ team: r.team, rank: r.rank, tied: r.tied }))).toEqual([
      { team: 0, rank: 1, tied: true },
      { team: 1, rank: 1, tied: true },
      { team: 2, rank: 3, tied: false },
    ]);
  });
});

describe("rankFinal", () => {
  it("uses competition ranking 1,1,3 and lists tied teams by team number", () => {
    expect(rankFinal([190, 60, 190]).map((r) => ({ team: r.team, rank: r.rank, tied: r.tied, coins: r.coins }))).toEqual([
      { team: 0, rank: 1, tied: true, coins: 190 },
      { team: 2, rank: 1, tied: true, coins: 190 },
      { team: 1, rank: 3, tied: false, coins: 60 },
    ]);
    expect(rankFinal([190, 190, 60]).map((r) => ({ team: r.team, rank: r.rank, tied: r.tied }))).toEqual([
      { team: 0, rank: 1, tied: true },
      { team: 1, rank: 1, tied: true },
      { team: 2, rank: 3, tied: false },
    ]);
  });

  it("gives all three teams joint 1st when final coins match, in team-number order", () => {
    expect(rankFinal([100, 100, 100]).map((r) => ({ team: r.team, rank: r.rank, tied: r.tied }))).toEqual([
      { team: 0, rank: 1, tied: true },
      { team: 1, rank: 1, tied: true },
      { team: 2, rank: 1, tied: true },
    ]);
  });
});

describe("slotOrder", () => {
  it("starts with the team that has the fewest coins", () => {
    const order = slotOrder({
      coins: [170, 190, 90],
      lastRoundRank: () => 1,
    });
    expect(order).toEqual([2, 0, 1]);
  });

  it("breaks a coin tie by sending the lower last-round rank first", () => {
    const ranks: Record<TeamIndex, 1 | 2 | 3> = { 0: 2, 1: 3, 2: 1 };
    const order = slotOrder({
      coins: [100, 100, 100],
      lastRoundRank: (team) => ranks[team],
    });
    expect(order).toEqual([1, 0, 2]);
  });
});

describe("applySlotOutcome", () => {
  it("pays 10× the bet including the stake, or drops the bet, or leaves a skip unchanged", () => {
    expect(applySlotOutcome(170, { kind: "win", bet: 20 })).toBe(350);
    expect(applySlotOutcome(90, { kind: "lose", bet: 30 })).toBe(60);
    expect(applySlotOutcome(190, { kind: "skip" })).toBe(190);
  });
});
