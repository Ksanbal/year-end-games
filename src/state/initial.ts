
import { DEFAULT_TEAM_NAMES } from "../games/catalog.ts";
import type { AppState } from "./types.ts";

export function initialState(): AppState {
  return {
    teams: [...DEFAULT_TEAM_NAMES],
    coins: [0, 0, 0],
    rounds: {},
    slotOrder: null,
    slotOutcomes: [null, null, null],
    phase: { kind: "opening" },
  };
}

export function isSessionInProgress(state: AppState): boolean {
  return state.phase.kind !== "opening" && state.phase.kind !== "teamSetup";
}

/** Mid-turn refresh restarts that turn. Finished turns and coins stay. */
export function rewindIfPlaying(state: AppState): AppState {
  if (state.phase.kind !== "playing") return state;
  return {
    ...state,
    phase: {
      kind: "turnReady",
      round: state.phase.round,
      turnIndex: state.phase.turnIndex,
    },
  };
}
