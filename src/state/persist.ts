
import { rewindIfPlaying } from "./initial.ts";
import type { AppState, Phase, RoundRecord, SlotOutcome, TeamIndex, TurnResult } from "./types.ts";
import { isRoundNumber, isTeamIndex } from "./types.ts";

export const STORAGE_KEY = "year-end-games:v1";
export const STORAGE_VERSION = 1;

type Persisted = {
  version: number;
  state: AppState;
};

export function serializeState(state: AppState): string {
  const payload: Persisted = { version: STORAGE_VERSION, state };
  return JSON.stringify(payload);
}

export function parseState(raw: unknown): AppState | null {
  if (typeof raw !== "string" && typeof raw !== "object") return null;
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!isRecord(value) || value.version !== STORAGE_VERSION) return null;
  const state = parseAppState(value.state);
  return state ? rewindIfPlaying(state) : null;
}

export function loadState(storage: Pick<Storage, "getItem"> = localStorage): AppState | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    return parseState(raw);
  } catch {
    return null;
  }
}

export function saveState(state: AppState, storage: Pick<Storage, "setItem"> = localStorage): void {
  storage.setItem(STORAGE_KEY, serializeState(state));
}

export function clearState(storage: Pick<Storage, "removeItem"> = localStorage): void {
  storage.removeItem(STORAGE_KEY);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseAppState(value: unknown): AppState | null {
  if (!isRecord(value)) return null;
  const teams = parseTeams(value.teams);
  const coins = parseCoins(value.coins);
  const rounds = parseRounds(value.rounds);
  const slotOrder = parseSlotOrder(value.slotOrder);
  const slotOutcomes = parseSlotOutcomes(value.slotOutcomes);
  const phase = parsePhase(value.phase);
  if (!teams || !coins || !rounds || slotOutcomes === null || !phase) return null;
  if (value.slotOrder !== null && !slotOrder) return null;
  return { teams, coins, rounds, slotOrder, slotOutcomes, phase };
}

function parseTeams(value: unknown): [string, string, string] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  if (!value.every((name) => typeof name === "string")) return null;
  return value as [string, string, string];
}

function parseCoins(value: unknown): [number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  if (!value.every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  return value as [number, number, number];
}

function parseRounds(value: unknown): AppState["rounds"] | null {
  if (!isRecord(value)) return null;
  const rounds: AppState["rounds"] = {};
  for (const [key, record] of Object.entries(value)) {
    const round = Number(key);
    if (!isRoundNumber(round)) return null;
    const parsed = parseRoundRecord(record);
    if (!parsed) return null;
    rounds[round] = parsed;
  }
  return rounds;
}

function parseRoundRecord(value: unknown): RoundRecord | null {
  if (!isRecord(value) || !Array.isArray(value.order) || !Array.isArray(value.results)) return null;
  if (value.order.length !== 3 || !value.order.every((t) => typeof t === "number" && isTeamIndex(t))) {
    return null;
  }
  if (value.results.length !== 3) return null;
  const results: RoundRecord["results"] = [null, null, null];
  for (let i = 0; i < 3; i += 1) {
    const item = value.results[i];
    if (item === null) continue;
    const result = parseTurnResult(item);
    if (!result) return null;
    results[i] = result;
  }
  return { order: value.order as [TeamIndex, TeamIndex, TeamIndex], results };
}

function parseTurnResult(value: unknown): TurnResult | null {
  if (!isRecord(value) || typeof value.kind !== "string") return null;
  if (value.kind === "score" && typeof value.score === "number" && Number.isFinite(value.score)) {
    return { kind: "score", score: value.score };
  }
  if (
    value.kind === "timeDiff" &&
    typeof value.stoppedAtMs === "number" &&
    Number.isFinite(value.stoppedAtMs) &&
    typeof value.autoStopped === "boolean"
  ) {
    return { kind: "timeDiff", stoppedAtMs: value.stoppedAtMs, autoStopped: value.autoStopped };
  }
  return null;
}

function parseSlotOrder(value: unknown): AppState["slotOrder"] {
  if (value === null) return null;
  if (!Array.isArray(value) || value.length !== 3) return null;
  if (!value.every((t) => typeof t === "number" && isTeamIndex(t))) return null;
  if (new Set(value).size !== 3) return null;
  return value as [TeamIndex, TeamIndex, TeamIndex];
}

function parseSlotOutcomes(value: unknown): AppState["slotOutcomes"] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const out: AppState["slotOutcomes"] = [null, null, null];
  for (let i = 0; i < 3; i += 1) {
    const item = value[i];
    if (item === null) continue;
    const parsed = parseSlotOutcome(item);
    if (!parsed) return null;
    out[i] = parsed;
  }
  return out;
}

function parseSlotOutcome(value: unknown): SlotOutcome | null {
  if (!isRecord(value) || typeof value.kind !== "string") return null;
  if (value.kind === "skip") return { kind: "skip" };
  if (
    (value.kind === "lose" || value.kind === "win") &&
    typeof value.bet === "number" &&
    Number.isInteger(value.bet)
  ) {
    return { kind: value.kind, bet: value.bet };
  }
  return null;
}

function parsePhase(value: unknown): Phase | null {
  if (!isRecord(value) || typeof value.kind !== "string") return null;
  switch (value.kind) {
    case "opening":
    case "gameIntro":
    case "teamSetup":
    case "slotExplain":
    case "slotIntro":
    case "slotDone":
      return { kind: value.kind };
    case "roundIntro":
    case "gameExplain":
    case "roundResult":
      return typeof value.round === "number" && isRoundNumber(value.round) ? { kind: value.kind, round: value.round } : null;
    case "shuffle":
      return typeof value.round === "number" && isRoundNumber(value.round) && typeof value.settled === "boolean"
        ? { kind: "shuffle", round: value.round, settled: value.settled }
        : null;
    case "turnReady":
    case "playing":
    case "turnResult":
      return typeof value.round === "number" && isRoundNumber(value.round) && isTurn(value.turnIndex)
        ? { kind: value.kind, round: value.round, turnIndex: value.turnIndex }
        : null;
    case "slotTurn":
      return isTurn(value.orderIndex) ? { kind: "slotTurn", orderIndex: value.orderIndex } : null;
    case "final":
      return typeof value.confirmNewGame === "boolean"
        ? { kind: "final", confirmNewGame: value.confirmNewGame }
        : null;
    default:
      return null;
  }
}

function isTurn(value: unknown): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}

