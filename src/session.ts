import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { Jump } from "./jump.ts";
import { initialState, isSessionInProgress } from "./state/initial.ts";
import { clearState, loadState, saveState } from "./state/persist.ts";
import { reduce } from "./state/reducer.ts";
import type { Action, AppState } from "./state/types.ts";

export function useSession(jump: Jump | null) {
  const boot = useMemo(() => {
    if (jump) {
      return { state: jump.state, recovery: jump.recovery, persist: false };
    }
    const saved = loadState();
    if (saved && isSessionInProgress(saved)) {
      return { state: saved, recovery: true, persist: true };
    }
    if (saved) {
      return { state: saved, recovery: false, persist: true };
    }
    return { state: initialState(), recovery: false, persist: true };
  }, [jump]);

  const [state, dispatchRaw] = useReducer(reduce, boot.state);
  const [recovery, setRecovery] = useState(boot.recovery);

  const dispatch = useCallback((action: Action) => {
    dispatchRaw(action);
  }, []);

  useEffect(() => {
    if (!boot.persist) return;
    if (state.phase.kind === "opening" && !isSessionInProgress(state) && noProgress(state)) {
      clearState();
      return;
    }
    saveState(state);
  }, [state, boot.persist]);

  return {
    state,
    dispatch,
    recovery,
    dismissRecovery: useCallback(() => setRecovery(false), []),
  };
}

function noProgress(state: AppState): boolean {
  return (
    Object.keys(state.rounds).length === 0 &&
    state.coins.every((n) => n === 0) &&
    state.slotOutcomes.every((n) => n === null)
  );
}
