
import { gameByRound } from "../games/catalog.ts";
import { initialState } from "./initial.ts";
import { clampName, nameReady } from "./names.ts";
import { applySlotOutcome, rankTeams, slotOrder } from "./scoring.ts";
import type {
  Action,
  AppState,
  RoundNumber,
  RoundRecord,
  TeamIndex,
  TurnIndex,
} from "./types.ts";

function isPermutation(order: readonly TeamIndex[]): boolean {
  return new Set(order).size === 3 && order.every((t) => t === 0 || t === 1 || t === 2);
}

function lastRoundRank(state: AppState, team: TeamIndex): 1 | 2 | 3 {
  const record = state.rounds[5];
  if (!record) return 3;
  const filled = record.results.flatMap((result, turn) =>
    result ? [{ team: record.order[turn] as TeamIndex, result }] : [],
  );
  if (filled.length < 3) return 3;
  const standing = rankTeams(filled).find((row) => row.team === team);
  return standing?.rank ?? 3;
}

function applyCoins(state: AppState, round: RoundNumber): [number, number, number] {
  const record = state.rounds[round];
  if (!record) return state.coins;
  const filled = record.results.flatMap((result, turn) =>
    result ? [{ team: record.order[turn] as TeamIndex, result }] : [],
  );
  const coins: [number, number, number] = [...state.coins];
  for (const row of rankTeams(filled)) {
    coins[row.team] += row.coins;
  }
  return coins;
}

export function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "START_INTRO":
      if (state.phase.kind !== "opening") return state;
      return { ...state, phase: { kind: "gameIntro" } };
    case "START_SETUP":
      if (state.phase.kind !== "gameIntro") return state;
      return { ...state, phase: { kind: "teamSetup" } };
    case "SET_TEAM_NAME": {
      if (state.phase.kind !== "teamSetup") return state;
      const teams: [string, string, string] = [...state.teams];
      teams[action.index] = clampName(action.name);
      return { ...state, teams };
    }
    case "START_GAME":
      if (state.phase.kind !== "teamSetup") return state;
      if (!nameReady(state.teams)) return state;
      return { ...state, phase: { kind: "roundIntro", round: 1 } };
    case "START_GAME_EXPLAIN":
      if (state.phase.kind !== "roundIntro") return state;
      return { ...state, phase: { kind: "gameExplain", round: state.phase.round } };
    case "START_ROUND": {
      if (state.phase.kind !== "gameExplain") return state;
      if (!isPermutation(action.order)) return state;
      const round = state.phase.round;
      const record: RoundRecord = {
        order: action.order,
        results: [null, null, null],
      };
      return {
        ...state,
        rounds: { ...state.rounds, [round]: record },
        phase: { kind: "shuffle", round, settled: false },
      };
    }
    case "SHUFFLE_SETTLED": {
      if (state.phase.kind !== "shuffle" || state.phase.settled) return state;
      return { ...state, phase: { ...state.phase, settled: true } };
    }
    case "ADVANCE_FROM_SHUFFLE": {
      if (state.phase.kind !== "shuffle" || !state.phase.settled) return state;
      return {
        ...state,
        phase: { kind: "turnReady", round: state.phase.round, turnIndex: 0 },
      };
    }
    case "BEGIN_TURN": {
      if (state.phase.kind !== "turnReady") return state;
      return {
        ...state,
        phase: {
          kind: "playing",
          round: state.phase.round,
          turnIndex: state.phase.turnIndex,
        },
      };
    }
    case "FINISH_TURN": {
      if (state.phase.kind !== "playing") return state;
      const { round, turnIndex } = state.phase;
      const record = state.rounds[round];
      if (!record || record.results[turnIndex]) return state;
      const expected = gameByRound(round).resultKind;
      if (action.result.kind !== expected) return state;
      const results = [...record.results] as RoundRecord["results"];
      results[turnIndex] = action.result;
      return {
        ...state,
        rounds: { ...state.rounds, [round]: { ...record, results } },
        phase: { kind: "turnResult", round, turnIndex },
      };
    }
    case "ADVANCE_FROM_TURN_RESULT": {
      if (state.phase.kind !== "turnResult") return state;
      const { round, turnIndex } = state.phase;
      if (turnIndex < 2) {
        return {
          ...state,
          phase: { kind: "turnReady", round, turnIndex: (turnIndex + 1) as TurnIndex },
        };
      }
      return state;
    }
    case "REVEAL_ROUND": {
      if (state.phase.kind !== "turnResult" || state.phase.turnIndex !== 2) return state;
      const round = state.phase.round;
      const record = state.rounds[round];
      if (!record || record.results.some((result) => result === null)) return state;
      return {
        ...state,
        coins: applyCoins(state, round),
        phase: { kind: "roundResult", round },
      };
    }
    case "ADVANCE_FROM_ROUND_RESULT": {
      if (state.phase.kind !== "roundResult") return state;
      if (state.phase.round < 5) {
        return {
          ...state,
          phase: { kind: "roundIntro", round: (state.phase.round + 1) as RoundNumber },
        };
      }
      return {
        ...state,
        slotOrder: slotOrder({
          coins: state.coins,
          lastRoundRank: (team) => lastRoundRank(state, team),
        }),
        phase: { kind: "slotExplain" },
      };
    }
    case "START_SLOT_INTRO":
      if (state.phase.kind !== "slotExplain") return state;
      return { ...state, phase: { kind: "slotIntro" } };
    case "START_SLOT": {
      if (state.phase.kind !== "slotIntro" || !state.slotOrder) return state;
      return {
        ...state,
        slotOutcomes: [null, null, null],
        phase: { kind: "slotTurn", orderIndex: 0 },
      };
    }
    case "FINISH_SLOT_TURN": {
      if (state.phase.kind !== "slotTurn" || !state.slotOrder) return state;
      const team = state.slotOrder[state.phase.orderIndex];
      if (state.slotOutcomes[team]) return state;
      if (action.outcome.kind !== "skip") {
        const bet = action.outcome.bet;
        if (!Number.isInteger(bet) || bet < 1 || bet > state.coins[team]) return state;
      }
      const outcomes = [...state.slotOutcomes] as AppState["slotOutcomes"];
      outcomes[team] = action.outcome;
      const coins: [number, number, number] = [...state.coins];
      coins[team] = applySlotOutcome(state.coins[team], action.outcome);
      const nextIndex = state.phase.orderIndex + 1;
      const lap = state.phase.lap ?? 0;
      if (nextIndex === 3 && lap < 2) {
        const previousSlotDelta: [number, number, number] = [...(state.previousSlotDelta ?? [0, 0, 0])];
        outcomes.forEach((outcome, i) => {
          if (outcome) previousSlotDelta[i] += applySlotOutcome(0, outcome);
        });
        return { ...state, coins, previousSlotDelta, slotOutcomes: [null, null, null], phase: { kind: "slotTurn", orderIndex: 0, lap: (lap + 1) as TurnIndex } };
      }
      return {
        ...state,
        coins,
        slotOutcomes: outcomes,
        phase:
          nextIndex > 2
            ? { kind: "slotDone" }
            : { kind: "slotTurn", orderIndex: nextIndex as TurnIndex, lap },
      };
    }
    case "REVEAL_FINAL":
      if (state.phase.kind !== "slotDone") return state;
      return { ...state, phase: { kind: "final", confirmNewGame: false } };
    case "REQUEST_NEW_GAME":
      if (state.phase.kind !== "final" || state.phase.confirmNewGame) return state;
      return { ...state, phase: { kind: "final", confirmNewGame: true } };
    case "CANCEL_NEW_GAME":
      if (state.phase.kind !== "final" || !state.phase.confirmNewGame) return state;
      return { ...state, phase: { kind: "final", confirmNewGame: false } };
    case "CONFIRM_NEW_GAME":
      if (state.phase.kind !== "final" || !state.phase.confirmNewGame) return state;
      return initialState();
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function randomOrder(random: () => number = Math.random): [TeamIndex, TeamIndex, TeamIndex] {
  const teams: TeamIndex[] = [0, 1, 2];
  for (let i = teams.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = teams[i];
    teams[i] = teams[j];
    teams[j] = tmp;
  }
  return teams as [TeamIndex, TeamIndex, TeamIndex];
}
