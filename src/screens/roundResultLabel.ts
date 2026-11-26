import { copy } from "../copy.ts";
import type { RoundNumber } from "../state/types.ts";

/** 08-3 (round 5) uses the wider [운명의 레버 시작] button. Rounds 1–4 keep [다음 라운드]. */
export function roundResultButtonLabel(round: RoundNumber): string {
  return round === 5 ? copy.startDestinysLever : copy.nextRound;
}

export function roundResultButtonStyle(round: RoundNumber) {
  return round === 5
    ? { left: 735, top: 900, width: 450 }
    : { left: 760, top: 900 };
}
