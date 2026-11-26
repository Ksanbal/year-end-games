
import { describe, expect, it } from "vitest";
import { initialState, isSessionInProgress, rewindIfPlaying } from "./initial.ts";
import { duplicateIndexes, nameReady } from "./names.ts";
import { parseState, serializeState } from "./persist.ts";
import { reduce } from "./reducer.ts";
import type { AppState, TeamIndex } from "./types.ts";

function playRound(
  state: AppState,
  scores: [number, number, number],
  order: [TeamIndex, TeamIndex, TeamIndex] = [1, 2, 0],
): AppState {
  let next = reduce(state, { type: "START_GAME_EXPLAIN" });
  next = reduce(next, { type: "START_ROUND", order });
  next = reduce(next, { type: "SHUFFLE_SETTLED" });
  next = reduce(next, { type: "ADVANCE_FROM_SHUFFLE" });
  for (let i = 0; i < 3; i += 1) {
    next = reduce(next, { type: "BEGIN_TURN" });
    next = reduce(next, { type: "FINISH_TURN", result: { kind: "score", score: scores[i] } });
    if (i < 2) next = reduce(next, { type: "ADVANCE_FROM_TURN_RESULT" });
  }
  return reduce(next, { type: "REVEAL_ROUND" });
}

function beginSetup(state: AppState = initialState()): AppState {
  return reduce(reduce(state, { type: "START_INTRO" }), { type: "START_SETUP" });
}

describe("team setup", () => {
  it("starts from the default names 1팀, 2팀, 3팀 and reaches round 1", () => {
    let state = initialState();
    expect(state.teams).toEqual(["1팀", "2팀", "3팀"]);
    state = reduce(state, { type: "START_INTRO" });
    expect(state.phase).toEqual({ kind: "gameIntro" });
    expect(isSessionInProgress(state)).toBe(false);
    const restoredIntro = parseState(serializeState(state));
    expect(restoredIntro?.phase).toEqual({ kind: "gameIntro" });
    state = reduce(state, { type: "START_SETUP" });
    expect(state.phase).toEqual({ kind: "teamSetup" });
    state = reduce(state, { type: "START_GAME" });
    expect(state.phase).toEqual({ kind: "roundIntro", round: 1 });
  });

  it("clamps names to 8 characters and blocks a start when a name is repeated", () => {
    let state = beginSetup();
    state = reduce(state, { type: "SET_TEAM_NAME", index: 0, name: "가나다라마바사아자" });
    expect(state.teams[0]).toBe("가나다라마바사아");
    state = reduce(state, { type: "SET_TEAM_NAME", index: 0, name: "1팀" });
    state = reduce(state, { type: "SET_TEAM_NAME", index: 2, name: "1팀" });
    expect(nameReady(state.teams)).toBe(false);
    expect([...duplicateIndexes(state.teams)]).toEqual([2]);
    expect(reduce(state, { type: "START_GAME" }).phase.kind).toBe("teamSetup");
  });
});

describe("round flow and coins", () => {
  it("awards coins only when the round result is revealed", () => {
    let state = reduce(beginSetup(), { type: "START_GAME" });
    state = reduce(state, { type: "START_GAME_EXPLAIN" });
    state = reduce(state, { type: "START_ROUND", order: [1, 2, 0] });
    state = reduce(state, { type: "SHUFFLE_SETTLED" });
    state = reduce(state, { type: "ADVANCE_FROM_SHUFFLE" });
    state = reduce(state, { type: "BEGIN_TURN" });
    state = reduce(state, { type: "FINISH_TURN", result: { kind: "score", score: 7 } });
    expect(state.coins).toEqual([0, 0, 0]);
    expect(state.phase).toEqual({ kind: "turnResult", round: 1, turnIndex: 0 });

    state = reduce(state, { type: "ADVANCE_FROM_TURN_RESULT" });
    state = reduce(state, { type: "BEGIN_TURN" });
    state = reduce(state, { type: "FINISH_TURN", result: { kind: "score", score: 12 } });
    state = reduce(state, { type: "ADVANCE_FROM_TURN_RESULT" });
    state = reduce(state, { type: "BEGIN_TURN" });
    state = reduce(state, { type: "FINISH_TURN", result: { kind: "score", score: 4 } });
    expect(reduce(state, { type: "ADVANCE_FROM_TURN_RESULT" }).phase.kind).toBe("turnResult");

    state = reduce(state, { type: "REVEAL_ROUND" });
    expect(state.phase).toEqual({ kind: "roundResult", round: 1 });
    expect(state.coins).toEqual([10, 30, 50]);
  });

  it("rejects a time result in a score round", () => {
    let state = reduce(beginSetup(), { type: "START_GAME" });
    state = reduce(state, { type: "START_GAME_EXPLAIN" });
    state = reduce(state, { type: "START_ROUND", order: [0, 1, 2] });
    state = reduce(state, { type: "SHUFFLE_SETTLED" });
    state = reduce(state, { type: "ADVANCE_FROM_SHUFFLE" });
    state = reduce(state, { type: "BEGIN_TURN" });
    const blocked = reduce(state, {
      type: "FINISH_TURN",
      result: { kind: "timeDiff", stoppedAtMs: 10_000, autoStopped: false },
    });
    expect(blocked.phase.kind).toBe("playing");
  });
});

describe("refresh recovery", () => {
  it("rewinds a mid-turn refresh to the start of that turn and keeps finished turns", () => {
    let state = reduce(beginSetup(), { type: "START_GAME" });
    state = reduce(state, { type: "START_GAME_EXPLAIN" });
    state = reduce(state, { type: "START_ROUND", order: [1, 2, 0] });
    state = reduce(state, { type: "SHUFFLE_SETTLED" });
    state = reduce(state, { type: "ADVANCE_FROM_SHUFFLE" });
    state = reduce(state, { type: "BEGIN_TURN" });
    state = reduce(state, { type: "FINISH_TURN", result: { kind: "score", score: 7 } });
    state = reduce(state, { type: "ADVANCE_FROM_TURN_RESULT" });
    state = reduce(state, { type: "BEGIN_TURN" });
    expect(state.phase.kind).toBe("playing");

    const restored = parseState(serializeState(state));
    expect(restored?.phase).toEqual({ kind: "turnReady", round: 1, turnIndex: 1 });
    expect(restored?.rounds[1]?.results[0]).toEqual({ kind: "score", score: 7 });
    expect(isSessionInProgress(restored!)).toBe(true);
    expect(rewindIfPlaying(state).phase.kind).toBe("turnReady");
  });

  it("clears saved progress only after the new-game confirmation", () => {
    let state = reduce(beginSetup(), { type: "START_GAME" });
    state = playRound(state, [7, 12, 4]);
    state = { ...state, phase: { kind: "final", confirmNewGame: false }, coins: [10, 30, 50] };
    state = reduce(state, { type: "REQUEST_NEW_GAME" });
    expect(state.phase).toEqual({ kind: "final", confirmNewGame: true });
    state = reduce(state, { type: "CANCEL_NEW_GAME" });
    expect(state.coins).toEqual([10, 30, 50]);
    state = reduce(state, { type: "REQUEST_NEW_GAME" });
    const reset = reduce(state, { type: "CONFIRM_NEW_GAME" });
    expect(reset).toEqual(initialState());
  });
});

describe("slot and final", () => {
  it("orders the slot from the lowest coins and applies skip, loss, and 777 payout", () => {
    let state = reduce(beginSetup(), { type: "START_GAME" });
    state = playRound(state, [7, 12, 4]); // coins: 1팀 10, 2팀 30, 3팀 50, order 2팀,3팀,1팀
    expect(state.coins).toEqual([10, 30, 50]);
    // Need last-round ranks for ties; coins already unique.
    // Jump through remaining rounds with the same scores so we can enter the slot.
    for (let round = 2; round <= 5; round += 1) {
      state = reduce(state, { type: "ADVANCE_FROM_ROUND_RESULT" });
      if (round >= 4) {
        // play time rounds
        state = reduce(state, { type: "START_GAME_EXPLAIN" });
        state = reduce(state, { type: "START_ROUND", order: [1, 2, 0] });
        state = reduce(state, { type: "SHUFFLE_SETTLED" });
        state = reduce(state, { type: "ADVANCE_FROM_SHUFFLE" });
        const stops = [10_200, 10_050, 11_000];
        for (let i = 0; i < 3; i += 1) {
          state = reduce(state, { type: "BEGIN_TURN" });
          state = reduce(state, {
            type: "FINISH_TURN",
            result: { kind: "timeDiff", stoppedAtMs: stops[i], autoStopped: false },
          });
          if (i < 2) state = reduce(state, { type: "ADVANCE_FROM_TURN_RESULT" });
        }
        state = reduce(state, { type: "REVEAL_ROUND" });
      } else {
        state = playRound(state, [7, 12, 4]);
      }
    }
    expect(state.phase).toEqual({ kind: "roundResult", round: 5 });
    state = reduce(state, { type: "ADVANCE_FROM_ROUND_RESULT" });
    expect(state.phase).toEqual({ kind: "slotExplain" });
    state = reduce(state, { type: "START_SLOT_INTRO" });
    expect(state.phase).toEqual({ kind: "slotIntro" });
    state = reduce(state, { type: "START_SLOT" });
    expect(state.phase.kind).toBe("slotTurn");
    expect(state.slotOrder?.[0]).toBe(0); // fewest coins: 1팀

    const firstTeam = state.slotOrder![0];
    const firstCoins = state.coins[firstTeam];
    state = reduce(state, { type: "FINISH_SLOT_TURN", outcome: { kind: "win", bet: 10 } });
    expect(state.coins[firstTeam]).toBe(firstCoins + 90);

    const secondTeam = state.slotOrder![1];
    const secondCoins = state.coins[secondTeam];
    state = reduce(state, { type: "FINISH_SLOT_TURN", outcome: { kind: "lose", bet: 20 } });
    expect(state.coins[secondTeam]).toBe(secondCoins - 20);

    const thirdTeam = state.slotOrder![2];
    const thirdCoins = state.coins[thirdTeam];
    state = reduce(state, { type: "FINISH_SLOT_TURN", outcome: { kind: "skip" } });
    expect(state.coins[thirdTeam]).toBe(thirdCoins);
    for (const lap of [1, 2]) {
      for (const orderIndex of [0, 1, 2]) {
        expect(state.phase).toEqual({ kind: "slotTurn", orderIndex, lap });
        state = reduce(state, { type: "FINISH_SLOT_TURN", outcome: { kind: "skip" } });
      }
    }
    expect(state.phase).toEqual({ kind: "slotDone" });

    state = reduce(state, { type: "REVEAL_FINAL" });
    expect(state.phase).toEqual({ kind: "final", confirmNewGame: false });
  });

  it("rejects a bet larger than the team's coins", () => {
    const state: AppState = {
      ...initialState(),
      coins: [5, 10, 15],
      slotOrder: [0, 1, 2],
      phase: { kind: "slotTurn", orderIndex: 0 },
    };
    const blocked = reduce(state, { type: "FINISH_SLOT_TURN", outcome: { kind: "lose", bet: 6 } });
    expect(blocked).toEqual(state);
  });
});

describe("explanation phases", () => {
  it("does not create a round until the explanation is advanced", () => {
    let state = reduce(beginSetup(), { type: "START_GAME" });
    const order: [TeamIndex, TeamIndex, TeamIndex] = [0, 1, 2];
    expect(reduce(state, { type: "START_ROUND", order })).toEqual(state);
    state = reduce(state, { type: "START_GAME_EXPLAIN" });
    expect(state.phase).toEqual({ kind: "gameExplain", round: 1 });
    expect(state.rounds).toEqual({});
    expect(isSessionInProgress(state)).toBe(true);
    expect(parseState(serializeState(state))).toEqual(state);
    state = reduce(state, { type: "START_ROUND", order });
    expect(state.phase).toEqual({ kind: "shuffle", round: 1, settled: false });
    expect(state.rounds[1]?.order).toEqual(order);
  });

  it("recovers slot explanation and requires the slot intro before play", () => {
    let state: AppState = { ...initialState(), phase: { kind: "roundResult", round: 5 }, coins: [10, 20, 30] };
    state = reduce(state, { type: "ADVANCE_FROM_ROUND_RESULT" });
    expect(state.phase).toEqual({ kind: "slotExplain" });
    expect(state.slotOrder).toEqual([0, 1, 2]);
    expect(isSessionInProgress(state)).toBe(true);
    expect(parseState(serializeState(state))).toEqual(state);
    expect(reduce(state, { type: "START_SLOT" })).toEqual(state);
    state = reduce(state, { type: "START_SLOT_INTRO" });
    expect(state.phase).toEqual({ kind: "slotIntro" });
    expect(reduce(state, { type: "START_SLOT" }).phase).toEqual({ kind: "slotTurn", orderIndex: 0 });
  });

  it("keeps the opening steps outside an active session and advances a middle round to its intro", () => {
    const opening = initialState();
    expect(isSessionInProgress(opening)).toBe(false);
    expect(isSessionInProgress(reduce(opening, { type: "START_INTRO" }))).toBe(false);
    expect(isSessionInProgress(beginSetup())).toBe(false);
    const state: AppState = { ...opening, phase: { kind: "roundResult", round: 3 } };
    expect(reduce(state, { type: "ADVANCE_FROM_ROUND_RESULT" }).phase).toEqual({ kind: "roundIntro", round: 4 });
  });
});
