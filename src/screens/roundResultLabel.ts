import { copy } from "../copy.ts";
import type { RoundNumber } from "../state/types.ts";

/** Every round-result screen, including 08-3, uses the same [다음 라운드] button. */
export function roundResultButtonLabel(_round: RoundNumber): string {
  return copy.nextRound;
}

export function roundResultButtonStyle(_round: RoundNumber) {
  return { left: 760, top: 900 };
}
