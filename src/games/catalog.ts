export const TEAM_COUNT = 3;
export const ROUND_COUNT = 5;
export const MAX_NAME_LENGTH = 8;
export const DEFAULT_TEAM_NAMES = ["1팀", "2팀", "3팀"] as const;

export const ROUND_COINS = { first: 50, second: 30, third: 10 } as const;

export const TARGET_MS = 10_000;
export const AUTO_STOP_MS = 20_000;

/** 777 pays 10× the bet including the stake (net +9×). DECISIONS.md 개발용 메모. */
export const SLOT_PAYOUT_MULTIPLIER = 10;

export const GAMES = [
  { id: 1, name: "운수 좋은 날", resultKind: "score" },
  { id: 2, name: "어디서 왔니", resultKind: "score" },
  { id: 3, name: "할아버지 말씀", resultKind: "score" },
  { id: 4, name: "딱 거기", resultKind: "timeDiff" },
  { id: 5, name: "눈 감고 셋 넷", resultKind: "timeDiff" },
] as const;

export type GameId = (typeof GAMES)[number]["id"];
export type GameDef = (typeof GAMES)[number];
export type ResultKind = GameDef["resultKind"];

export function gameByRound(round: GameId): GameDef {
  return GAMES[round - 1];
}

export function headerGameTitle(round: GameId): string {
  const game = gameByRound(round);
  return `라운드 ${round} / 5 · 게임 ${game.id} ${game.name}`;
}

export function introGameTitle(round: GameId): string {
  const game = gameByRound(round);
  return `게임 ${game.id} · ${game.name}`;
}
