# 연말간담회 게임 — foundation notes

Foundation only. Game boards and the 운명의 레버 machine are stubs so the full flow can run end to end. No GitHub repo or Vercel project in this unit.

## Stack

- Vite 8 + TypeScript + React 19
- Vitest for unit tests
- puppeteer-core + system Chrome for 1920×1080 screenshots
- Static SPA, fonts and assets bundled under `public/` so the event machine can run offline

## Commands

```bash
npm install
npm test
npm run dev
npm run build
npm run preview          # serves dist/, default http://127.0.0.1:4173
npm run screenshots:foundation
```

Jump to a designed screen: `http://127.0.0.1:5173/?screen=00-0` (also works on the preview build). When `?screen=` is present, localStorage is not written, so a live session is not overwritten.

## Folder layout

```
src/
  copy.ts                 # on-screen Korean, from the final frames only
  format.ts               # score / slot cell formatting
  jump.ts                 # ?screen= fixtures
  session.ts              # boot, persist, recovery overlay
  App.tsx                 # screen router
  styles/                 # tokens, fonts, global, screen extras
  state/                  # types, reducer, scoring, persist, tests
  ui/                     # canvas, sky, clouds, header, buttons, card, coin
  screens/                # shared screens (not a single game)
  games/
    catalog.ts            # ids, names, result kinds
    types.ts              # GameModule / SlotModule contract
    registry.ts           # register games here
    game1/…game5/         # stubs
    slot/                 # stub
public/
  fonts/                  # Do Hyeon, Pretendard Variable, IBM Plex Mono Bold
  assets/                 # handoff SVG/PNG (reel, lever, all-in, coins, clouds)
screenshots/foundation/   # common-screen captures at the design canvas size
```

## Module contract

Each of games 1–5 lives in `src/games/game<N>/` and is registered in `src/games/registry.ts`. Export a `GameModule`:

```ts
type GameModule = {
  id: 1 | 2 | 3 | 4 | 5;
  Play: (props: {
    context: { names: [string, string, string]; team: 0 | 1 | 2; turnIndex: 0 | 1 | 2; coins: [number, number, number] };
    onFinish: (result: TurnResult) => void;
  }) => ReactNode;
};

type TurnResult =
  | { kind: "score"; score: number }             // games 1–3, higher is better
  | { kind: "timeDiff"; stoppedAtMs: number; autoStopped: boolean }; // games 4–5
```

The slot module is `src/games/slot/`, `getSlot()` in the registry:

```ts
type SlotOutcome = { kind: "skip" } | { kind: "lose"; bet: number } | { kind: "win"; bet: number };

type SlotModule = {
  id: "slot";
  Play: (props: { context: SlotContext; onFinish: (outcome: SlotOutcome) => void }) => ReactNode;
  Done: (props: { onRevealFinal: () => void }) => ReactNode;
};
```

Call `onFinish` once per turn. The reducer records the result, awards nothing yet, and moves to `turnResult`. Do not dispatch reducer actions from a game module. Do not edit `src/state/reducer.ts`, `src/ui/*`, or `src/copy.ts` unless the change is truly shared.

`stoppedAtMs` is milliseconds from the start of the timer, 0–20000. Auto-stop at 20000.

A 777 win is `{ kind: "win", bet }`. The reducer pays 10× the bet including the stake (net +9×). A miss is `{ kind: "lose", bet }`. A skip is `{ kind: "skip" }`. Bet must be an integer from 1 through the team's current coins.

## State shape

`AppState` (`src/state/types.ts`):

- `teams: [string, string, string]` — defaults `1팀`, `2팀`, `3팀`, max 8 characters
- `coins: [number, number, number]` — 0 until a round result is revealed
- `rounds[1..5]`: `{ order: [TeamIndex, TeamIndex, TeamIndex], results: [TurnResult | null, ...] }`
- `slotOrder`, `slotOutcomes`
- `phase`: discriminated union (`opening`, `teamSetup`, `roundIntro`, `shuffle`, `turnReady`, `playing`, `turnResult`, `roundResult`, `slotIntro`, `slotTurn`, `slotDone`, `final`)

The reducer is a pure function. Shuffle order is supplied by the `START_ROUND` action (the UI calls `randomOrder()`). Slot order is computed when entering `slotIntro`.

Persisted to `localStorage` key `year-end-games:v1` after every transition. Parsed at the storage boundary. A mid-turn refresh (`phase.kind === "playing"`) is rewound to `turnReady` for that turn. Finished turns and coins stay. If a session is already past team setup, boot shows 11-1 (`이어서 진행`) first. [새 게임] → confirm → `CONFIRM_NEW_GAME` clears storage and returns to the opening.

## How to add a game

1. Replace the stub in `src/games/game<N>/index.tsx` (or `src/games/slot/`).
2. Keep the `Play` signature and call `onFinish` with the right `TurnResult` / `SlotOutcome`.
3. Use `Header` + `headerGameTitle(round)` for the top bar. Copy only from `src/copy.ts` or from the design frames.
4. Use CSS variables from `src/styles/tokens.css` and assets under `/assets/`.
5. Add unit tests next to the game if the logic is non-trivial. Do not change shared files to special-case one game.

## Defaults chosen

- Canvas is a fixed 1920×1080 layer, scaled to fit the viewport and letterboxed (`#0B1430`).
- Screen transition: 250ms opacity fade, ease-out. `prefers-reduced-motion`: no animation.
- Confirm / result dim: `#0E1A33` at 55% opacity, no designed enter animation, so the same 250ms fade applies when the overlay mounts.
- 차례 섞기 (01-1 → 01-2): slot-style name cycling in each card, 120ms tick, auto-settles after 3 seconds, no sound. `prefers-reduced-motion`: skip straight to the settled order. (motion.md marked the easing as 확인 필요.)
- Fonts are bundled, not loaded from the network: Do Hyeon Regular (TTF), Pretendard Variable (WOFF2, weights 400–700), IBM Plex Mono Bold (WOFF2). IBM Plex Mono is ready for the 10-second timers.
- Team-name uniqueness: the later duplicate field gets the 6px `#D7261E` border, matching 00-2 (the first occurrence stays clean). Empty names also block [게임 시작].

## Scoring rules implemented

All from `DECISIONS.md`. Later-dated lines win.

- Round coins: 1등 50, 2등 30, 3등 10 (1라운드).
- Ties share rank and coins. Joint 1st makes the next team 3rd (1라운드, 4라운드 "공동 2등", "세 팀이 모두 같으면 모두 공동 1등").
- Coins are awarded only when 08 라운드 결과 is revealed, not after each turn (4라운드 "결과 공개… 라운드 끝에 다시 눌러 라운드 순위를 보여준다"; 4라운드 "팀별 코인 현황은 라운드 결과와 슬롯머신 화면에서만").
- Games 4–5: closer `abs(stoppedAtMs - 10000)` ranks higher. 20s auto-stop is recorded as a 10s difference (2라운드, 4라운드). A fully equal difference is the same rank.
- Slot order: fewest coins first; if coins are equal, the lower last-round rank goes first (4라운드).
- 777 pays 10× the bet including the stake (net +9×); otherwise the bet is lost; cherry and bell have no payout (개발용 메모). Skip does not change coins (3라운드).
- Final rank is by remaining coins; equal coins share a rank (4라운드). Final screen also shows coins and per-round ranks (5라운드).

## Deviations and missing copy

- 01-3 still has the visible Figma line `플레이어는 화면 앞으로 나와 주세요` (135:116). DECISIONS.md 2026-11-24 23:14 said to drop 01-3 준비 안내, but the final 본안 still shows it, so the screen follows the 본안.
- 07 차례 결과 was designed for 게임 1 only (`열린 타일 수`, `N점`). Games 4–5 reuse `10초와 차이` and a 0.001s delta. Games 2–3 show `N점` and omit a subtitle — no designed label was found.
- After 라운드 5 the 08 button is still `다음 라운드`. That is the only designed label. It goes to 09-0.
- Slot stub [최종 결과 공개] comes from DECISIONS.md 5라운드, not from a dumped 09-5 button string. Slot workers should confirm the 09-5 / last-team frame.
- Joint final title: there is no designed frame for two or three 1등. The screen uses `공동 1등` plus the team names, not a new sentence.
- 팀 색 점 (DECISIONS.md 2026-11-24 18:17) are not in the final common frames, so they are not drawn.
- 08-2 fixture orders joint-1st rows by team index (2팀 then 3팀). The design example showed 3팀 then 2팀. Ranking and coins match.
- Coins are CSS, not the handoff PNGs, so they scale to 58 / 72 / 86 / 108. Handoff coin assets remain in `public/assets/` for later use.
- 09-1…09-5, game boards, lever drag, [올인] motion, and reel spin are out of scope. Stubs show the header and a finish / skip path only.

## What game / slot workers should know

- Shared chrome and the reducer are done. Stay inside `src/games/<id>/` plus tests.
- `?screen=02-1` (and 03-1…06-1) hydrates `playing` for that round so you can screenshot a stub or an in-progress board.
- In-game board state is not persisted. A refresh mid-turn always restarts the turn at 01-3 (or the game-4/5 start screen, once that screen is the real one).
- Header format after shuffle starts: `라운드 N / 5 · 게임 N {새 이름}`. Right-side meta during a turn: `차례 K / 3` or `차례 K / 3 · {팀}`.
- Use new game names only on screen. Do not invent Korean. If a string is missing, leave it out and list it.
