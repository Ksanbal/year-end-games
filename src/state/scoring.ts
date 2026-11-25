
import { ROUND_COINS, SLOT_PAYOUT_MULTIPLIER, TARGET_MS } from "../games/catalog.ts";
import type { TeamIndex, TurnResult } from "./types.ts";

export type Standing = {
  team: TeamIndex;
  rank: 1 | 2 | 3;
  tied: boolean;
  coins: 50 | 30 | 10;
  result: TurnResult;
};

export function timeDeltaMs(result: { stoppedAtMs: number }): number {
  return Math.abs(result.stoppedAtMs - TARGET_MS);
}

/** Lower is better (a finished ahead of b). Equal values stay equal. */
export function compareResults(a: TurnResult, b: TurnResult): number {
  if (a.kind === "score" && b.kind === "score") {
    return b.score - a.score;
  }
  if (a.kind === "timeDiff" && b.kind === "timeDiff") {
    return timeDeltaMs(a) - timeDeltaMs(b);
  }
  throw new Error("compareResults: mixed result kinds");
}

function qualityKey(result: TurnResult): number {
  return result.kind === "score" ? -result.score : timeDeltaMs(result);
}

const COIN_FOR_RANK: Record<1 | 2 | 3, 50 | 30 | 10> = {
  1: ROUND_COINS.first,
  2: ROUND_COINS.second,
  3: ROUND_COINS.third,
};

/**
 * Competition ranking with equal coins for a tie.
 * Joint 1st skips 2nd (the next team is 3rd). DECISIONS.md 1라운드·4라운드.
 */
export function rankTeams(
  entries: readonly { team: TeamIndex; result: TurnResult }[],
): Standing[] {
  const sorted = [...entries].sort((a, b) => {
    const cmp = compareResults(a.result, b.result);
    if (cmp !== 0) return cmp;
    return a.team - b.team;
  });

  const standings: Standing[] = [];
  let i = 0;
  while (i < sorted.length) {
    const key = qualityKey(sorted[i].result);
    let j = i + 1;
    while (j < sorted.length && qualityKey(sorted[j].result) === key) j += 1;
    const place = (i + 1) as 1 | 2 | 3;
    const tied = j - i > 1;
    for (let k = i; k < j; k += 1) {
      standings.push({
        team: sorted[k].team,
        rank: place,
        tied,
        coins: COIN_FOR_RANK[place],
        result: sorted[k].result,
      });
    }
    i = j;
  }
  return standings;
}

export type FinalStanding = {
  team: TeamIndex;
  rank: 1 | 2 | 3;
  tied: boolean;
  coins: number;
};

/** Final ranking by remaining coins. Equal coins share a rank. */
export function rankFinal(coins: readonly [number, number, number]): FinalStanding[] {
  const entries: { team: TeamIndex; coins: number }[] = [
    { team: 0, coins: coins[0] },
    { team: 1, coins: coins[1] },
    { team: 2, coins: coins[2] },
  ];
  entries.sort((a, b) => b.coins - a.coins || a.team - b.team);

  const out: FinalStanding[] = [];
  let i = 0;
  while (i < entries.length) {
    const value = entries[i].coins;
    let j = i + 1;
    while (j < entries.length && entries[j].coins === value) j += 1;
    const place = (i + 1) as 1 | 2 | 3;
    const tied = j - i > 1;
    for (let k = i; k < j; k += 1) {
      out.push({ team: entries[k].team, rank: place, tied, coins: entries[k].coins });
    }
    i = j;
  }
  return out;
}

/**
 * Slot order: fewest coins first; if coins are equal, the lower last-round
 * rank goes first. DECISIONS.md 4라운드.
 */
export function slotOrder(args: {
  coins: readonly [number, number, number];
  lastRoundRank: (team: TeamIndex) => 1 | 2 | 3;
}): [TeamIndex, TeamIndex, TeamIndex] {
  const teams: TeamIndex[] = [0, 1, 2];
  teams.sort((a, b) => {
    if (args.coins[a] !== args.coins[b]) return args.coins[a] - args.coins[b];
    return args.lastRoundRank(b) - args.lastRoundRank(a);
  });
  return teams as [TeamIndex, TeamIndex, TeamIndex];
}

export function applySlotOutcome(coins: number, outcome: { kind: string; bet?: number }): number {
  if (outcome.kind === "skip") return coins;
  const bet = outcome.bet ?? 0;
  if (outcome.kind === "lose") return coins - bet;
  if (outcome.kind === "win") return coins - bet + bet * SLOT_PAYOUT_MULTIPLIER;
  return coins;
}
