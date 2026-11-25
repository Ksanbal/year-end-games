import { copy } from "./copy.ts";
import { timeDeltaMs } from "./state/scoring.ts";
import type { SlotOutcome, TurnResult } from "./state/types.ts";
import type { Standing } from "./state/scoring.ts";

export function formatTurnScore(result: TurnResult): string {
  if (result.kind === "score") return copy.scorePoints(result.score);
  return (timeDeltaMs(result) / 1000).toFixed(3);
}

export function formatRoundCell(standing: Standing): string {
  return `${copy.rank(standing.rank, standing.tied)} ${standing.coins}`;
}

export function formatSlotCell(outcome: SlotOutcome | null): string {
  if (!outcome) return "";
  if (outcome.kind === "skip") return copy.slotSkip;
  if (outcome.kind === "win") return copy.slotGain(outcome.bet * 9);
  return copy.slotLoss(outcome.bet);
}

export function minusSign(text: string): { font: "display" | "ui"; text: string }[] {
  const minus = "−";
  if (!text.includes(minus) && !text.includes("→") && !text.includes("✱")) {
    return [{ font: "display", text }];
  }
  return text.split(/([−→✱])/).filter(Boolean).map((part) => ({
    font: part === minus || part === "→" || part === "✱" ? "ui" : "display",
    text: part,
  }));
}
