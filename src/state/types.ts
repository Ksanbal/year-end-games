
import type { GameId } from "../games/catalog.ts";

export type TeamIndex = 0 | 1 | 2;
export type TurnIndex = 0 | 1 | 2;
export type RoundNumber = GameId;

export type ScoreResult = {
  kind: "score";
  score: number;
};

export type TimeResult = {
  kind: "timeDiff";
  stoppedAtMs: number;
  autoStopped: boolean;
};

export type TurnResult = ScoreResult | TimeResult;

export type SlotOutcome =
  | { kind: "skip" }
  | { kind: "lose"; bet: number }
  | { kind: "win"; bet: number };

export type Phase =
  | { kind: "opening" }
  | { kind: "teamSetup" }
  | { kind: "roundIntro"; round: RoundNumber }
  | { kind: "shuffle"; round: RoundNumber; settled: boolean }
  | { kind: "turnReady"; round: RoundNumber; turnIndex: TurnIndex }
  | { kind: "playing"; round: RoundNumber; turnIndex: TurnIndex }
  | { kind: "turnResult"; round: RoundNumber; turnIndex: TurnIndex }
  | { kind: "roundResult"; round: RoundNumber }
  | { kind: "slotIntro" }
  | { kind: "slotTurn"; orderIndex: TurnIndex }
  | { kind: "slotDone" }
  | { kind: "final"; confirmNewGame: boolean };

export type RoundRecord = {
  order: [TeamIndex, TeamIndex, TeamIndex];
  results: [TurnResult | null, TurnResult | null, TurnResult | null];
};

export type AppState = {
  teams: [string, string, string];
  coins: [number, number, number];
  rounds: Partial<Record<RoundNumber, RoundRecord>>;
  slotOrder: [TeamIndex, TeamIndex, TeamIndex] | null;
  slotOutcomes: [SlotOutcome | null, SlotOutcome | null, SlotOutcome | null];
  phase: Phase;
};

export type Action =
  | { type: "START_SETUP" }
  | { type: "SET_TEAM_NAME"; index: TeamIndex; name: string }
  | { type: "START_GAME" }
  | {
      type: "START_ROUND";
      order: [TeamIndex, TeamIndex, TeamIndex];
    }
  | { type: "SHUFFLE_SETTLED" }
  | { type: "ADVANCE_FROM_SHUFFLE" }
  | { type: "BEGIN_TURN" }
  | { type: "FINISH_TURN"; result: TurnResult }
  | { type: "ADVANCE_FROM_TURN_RESULT" }
  | { type: "REVEAL_ROUND" }
  | { type: "ADVANCE_FROM_ROUND_RESULT" }
  | { type: "START_SLOT" }
  | { type: "FINISH_SLOT_TURN"; outcome: SlotOutcome }
  | { type: "REVEAL_FINAL" }
  | { type: "REQUEST_NEW_GAME" }
  | { type: "CANCEL_NEW_GAME" }
  | { type: "CONFIRM_NEW_GAME" }
  | { type: "HYDRATE"; state: AppState };

export function isTeamIndex(n: number): n is TeamIndex {
  return n === 0 || n === 1 || n === 2;
}

export function isRoundNumber(n: number): n is RoundNumber {
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5;
}
