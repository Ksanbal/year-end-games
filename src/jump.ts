import { initialState } from "./state/initial.ts";
import { rankTeams } from "./state/scoring.ts";
import type { AppState, RoundNumber, TeamIndex, TurnResult } from "./state/types.ts";

export type Jump = { code: string; state: AppState; recovery: boolean };

export function readJump(): Jump | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("screen");
  if (!raw) return null;
  const long = params.has("long") || raw.startsWith("long-");
  const code = raw.startsWith("long-") ? raw.slice(5) : raw;
  const jump = stateForScreen(code);
  if (!jump) return null;
  if (!long) return jump;
  return { ...jump, code: raw, state: { ...jump.state, teams: [...LONG_TEAM_NAMES] } };
}

export function stateForScreen(code: string): Jump | null {
  switch (code) {
    case "00-0":
      return pack(code, initialState());
    case "00-0a":
      return pack(code, { ...initialState(), phase: { kind: "gameIntro" } });
    case "00-1":
      return pack(code, { ...initialState(), phase: { kind: "teamSetup" } });
    case "00-2":
      return pack(code, { ...initialState(), teams: ["1팀", "2팀", "1팀"], phase: { kind: "teamSetup" } });
    case "01-0":
    case "03-0":
    case "04-0":
    case "05-i":
    case "06-i":
      return pack(code, { ...initialState(), phase: { kind: "roundIntro", round: introRound(code) } });
    case "01-E":
    case "03-E":
    case "04-E":
    case "05-E":
    case "06-E":
      return pack(code, { ...initialState(), phase: { kind: "gameExplain", round: introRound(code) } });
    case "09-E":
      return pack(code, { ...exampleCampaign("intro"), phase: { kind: "slotExplain" } });
    case "01-1":
      return pack(code, shuffle(false));
    case "01-2":
      return pack(code, shuffle(true));
    case "01-3":
      return pack(code, { ...roundAt([7, null, null], 0), phase: { kind: "turnReady", round: 1, turnIndex: 0 } });
    case "07-1":
      return pack(code, roundAt([7, null, null], 0));
    case "07-2":
      return pack(code, roundAt([7, 12, 4], 2));
    case "08-1":
      return pack(code, revealed([7, 12, 4]));
    case "08-2":
      return pack(code, revealed([9, 9, 4], [2, 1, 0]));
    case "08-3":
      return pack(code, { ...exampleCampaign("intro"), phase: { kind: "roundResult", round: 5 } });
    case "09-0":
      return pack(code, exampleCampaign("intro"));
    case "09-1":
    case "09-1b":
    case "09-2":
    case "09-2a":
    case "09-3":
    case "09-4":
    case "09-6":
      return pack(code, slotTurnExample(1));
    case "09-5":
      return pack(code, slotTurnExample(2));
    case "09-7":
      return pack(code, slotTurnExample(1));
    case "10-1":
      return pack(code, exampleCampaign("final", false));
    case "10-2":
      return pack(code, exampleCampaign("final", true));
    case "10-3":
      return pack(code, exampleCampaign("final", false, "tie"));
    case "10-3all":
      return pack(code, exampleCampaign("final", false, "allTie"));
    case "10-3long":
      return pack(code, longAllTieCampaign());
    case "10-3-6":
      return pack(code, namedAllTieCampaign(SIX_CHAR_TEAM_NAMES));
    case "10-3-7":
      return pack(code, namedAllTieCampaign(SEVEN_CHAR_TEAM_NAMES));
    case "11-1":
      return pack(code, recoveryExample(), true);
    default:
      if (/^0[2-6]-/.test(code)) {
        // Screen codes 02–06 are games 1–5, so the round is the section number minus one.
        const round = (Number(code.slice(0, 2)) - 1) as RoundNumber;
        return pack(code, {
          ...roundAt([null, null, null], 0, [1, 2, 0], round),
          phase: { kind: "playing", round, turnIndex: 0 },
        });
      }
      return null;
  }
}

function pack(code: string, state: AppState, recovery = false): Jump {
  return { code, state, recovery };
}

function introRound(code: string): RoundNumber {
  if (code === "03-0" || code === "03-E") return 2;
  if (code === "04-0" || code === "04-E") return 3;
  if (code === "05-i" || code === "05-E") return 4;
  if (code === "06-i" || code === "06-E") return 5;
  return 1;
}

function shuffle(settled: boolean): AppState {
  return {
    ...initialState(),
    rounds: {
      1: { order: [1, 2, 0], results: [null, null, null] },
    },
    phase: { kind: "shuffle", round: 1, settled },
  };
}

function score(n: number | null): TurnResult | null {
  return n === null ? null : { kind: "score", score: n };
}

function scoresOf(values: [number | null, number | null, number | null]): [TurnResult | null, TurnResult | null, TurnResult | null] {
  return [score(values[0]), score(values[1]), score(values[2])];
}

function roundAt(
  values: [number | null, number | null, number | null],
  turnIndex: 0 | 1 | 2,
  order: [TeamIndex, TeamIndex, TeamIndex] = [1, 2, 0],
  round: RoundNumber = 1,
): AppState {
  const results = scoresOf(values);
  return {
    ...initialState(),
    rounds: { [round]: { order, results } },
    phase: { kind: "turnResult", round, turnIndex },
  };
}

function revealed(
  values: [number, number, number],
  order: [TeamIndex, TeamIndex, TeamIndex] = [1, 2, 0],
): AppState {
  const mid = roundAt(values, 2, order);
  const record = mid.rounds[1]!;
  const coins: [number, number, number] = [0, 0, 0];
  const entries = record.results.flatMap((result, turn) =>
    result ? [{ team: record.order[turn], result }] : [],
  );
  for (const row of rankTeams(entries)) {
    coins[row.team] += row.coins;
  }
  return { ...mid, coins, phase: { kind: "roundResult", round: 1 } };
}


function recoveryExample(): AppState {
  return {
    ...initialState(),
    rounds: {
      1: { order: [1, 2, 0], results: [null, null, null] },
      2: { order: [0, 1, 2], results: [null, null, null] },
      3: { order: [0, 2, 1], results: [{ kind: "score", score: 4 }, null, null] },
    },
    phase: { kind: "turnReady", round: 3, turnIndex: 1 },
  };
}

function exampleCampaign(
  stage: "intro" | "final",
  confirmNewGame = false,
  ending: "solo" | "tie" | "allTie" = "solo",
): AppState {
  const order: [TeamIndex, TeamIndex, TeamIndex] = [0, 1, 2];
  const rounds: AppState["rounds"] = {
    1: rankedRound(order, [12, 7, 4]),
    2: rankedRound(order, [7, 12, 4]),
    3: rankedRound(order, [4, 12, 7]),
    4: rankedRound(order, [12, 4, 7]),
    5: rankedRound(order, [7, 12, 4]),
  };
  if (stage === "intro") {
    return {
      ...initialState(),
      coins: [170, 190, 90],
      rounds,
      slotOrder: [2, 0, 1],
      slotOutcomes: [null, null, null],
      phase: { kind: "slotIntro" },
    };
  }
  if (ending === "tie") {
    return {
      ...initialState(),
      coins: [170, 170, 60],
      rounds,
      slotOrder: [2, 0, 1],
      slotOutcomes: [
        { kind: "skip" },
        { kind: "lose", bet: 20 },
        { kind: "lose", bet: 30 },
      ],
      phase: { kind: "final", confirmNewGame },
    };
  }
  if (ending === "allTie") {
    return {
      ...initialState(),
      coins: [170, 170, 170],
      rounds,
      slotOrder: [2, 0, 1],
      slotOutcomes: [
        { kind: "skip" },
        { kind: "skip" },
        { kind: "skip" },
      ],
      phase: { kind: "final", confirmNewGame },
    };
  }
  return {
    ...initialState(),
    coins: [350, 190, 60],
    rounds,
    slotOrder: [2, 0, 1],
    slotOutcomes: [
      { kind: "win", bet: 20 },
      { kind: "skip" },
      { kind: "lose", bet: 30 },
    ],
    phase: { kind: "final", confirmNewGame },
  };
}


/** Three unique 8-character names, all tied for first. */
export const LONG_TEAM_NAMES: [string, string, string] = [
  "가나다라마바사아",
  "가나다라마바사자",
  "가나다라마바사차",
];

export const SIX_CHAR_TEAM_NAMES: [string, string, string] = [
  "가나다라마바",
  "가나다라마사",
  "가나다라마아",
];

export const SEVEN_CHAR_TEAM_NAMES: [string, string, string] = [
  "가나다라마바사",
  "가나다라마바아",
  "가나다라마바자",
];

function namedAllTieCampaign(teams: [string, string, string]): AppState {
  const base = exampleCampaign("final", false, "allTie");
  return { ...base, teams };
}

function longAllTieCampaign(): AppState {
  return namedAllTieCampaign(LONG_TEAM_NAMES);
}

function slotTurnExample(orderIndex: 0 | 1 | 2): AppState {
  const base = exampleCampaign("intro");
  return { ...base, phase: { kind: "slotTurn", orderIndex, lap: orderIndex === 2 ? 2 : 0 } };
}

function rankedRound(
  order: [TeamIndex, TeamIndex, TeamIndex],
  values: [number, number, number],
): NonNullable<AppState["rounds"][RoundNumber]> {
  return { order, results: scoresOf(values) };
}
