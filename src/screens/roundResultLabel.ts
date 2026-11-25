import { copy } from "../copy.ts";
import type { RoundNumber } from "../state/types.ts";

/**
 * 08-1 and 08-2 are the only designed 08 frames, and both use [다음 라운드].
 * There is no last-round 08 button that names the move into 운명의 레버,
 * so the label stays the same on every round including 5.
 */
export function roundResultButtonLabel(_round: RoundNumber): string {
  return copy.nextRound;
}
