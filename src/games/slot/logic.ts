/** Pure rules for 운명의 레버: bets, lever threshold, reel odds, and payout. */

export const SYMBOLS = ["seven", "cherry", "bell"] as const;
export type ReelSymbol = (typeof SYMBOLS)[number];
export type ReelStops = [ReelSymbol, ReelSymbol, ReelSymbol];

export const LEVER_MAX_PX = 280;
export const LEVER_SPIN_THRESHOLD_PX = 168;
export const LEVER_KNOB_REST_Y = 300;
export const LEVER_AXIS_X = 1644;
export const LEVER_AXIS_Y = 440;
export const LEVER_SPRING_MS = 250;
export const LEVER_COMMIT_MS = 120;
export const LEVER_RETURN_AFTER_SPIN_MS = 400;
export const HINT_HIDE_MS = 150;
export const HINT_RESTART_MS = 1000;
export const HINT_LOOP_MS = 1600;

/** All three reels spin this long, then stop left to right one second apart. */
export const REEL_SPIN_ALL_MS = 3000;
export const REEL_STOP_STAGGER_MS = 1000;
/** Default for the undefined stop easing. */
export const REEL_STOP_EASE_MS = 400;
export const REEL_OVERSHOOT_PX = 24;
export const REEL_STRIP_PITCH = 100;
export const REEL_SPIN_PX_PER_SEC = 1200;
export const WIN_EFFECT_MS = 1500;
export const WIN_PAYOUT_MULTIPLIER = 10;

export const BET_STEP_SMALL = 1;
export const BET_STEP_LARGE = 10;

export type SlotView =
  | { kind: "betting"; bet: number; confirmAllIn: boolean }
  | { kind: "ready"; bet: number }
  | { kind: "spinning"; bet: number; stops: ReelStops }
  | { kind: "result"; outcome: SlotPlayOutcome; stops: [ReelSymbol | "dash", ReelSymbol | "dash", ReelSymbol | "dash"] };

export type SlotPlayOutcome =
  | { kind: "skip" }
  | { kind: "lose"; bet: number }
  | { kind: "win"; bet: number };

export function clampBet(value: number, coins: number): number {
  if (coins < 1) return 0;
  if (!Number.isFinite(value)) return 1;
  return Math.min(coins, Math.max(1, Math.trunc(value)));
}

export function nudgeBet(bet: number, delta: number, coins: number): number {
  return clampBet(bet + delta, coins);
}

export function canNudge(bet: number, delta: number, coins: number): boolean {
  return nudgeBet(bet, delta, coins) !== clampBet(bet, coins);
}

export function isAllIn(bet: number, coins: number): boolean {
  return coins >= 1 && bet === coins;
}

export function defaultBet(coins: number): number {
  return clampBet(1, coins);
}

const ZERO_COIN_SKIP: SlotView = {
  kind: "result",
  outcome: { kind: "skip" },
  stops: ["dash", "dash", "dash"],
};

/** A team that already has 0 coins when its turn starts is skipped with no betting UI. */
export function openingView(coins: number): SlotView {
  if (coins < 1) return ZERO_COIN_SKIP;
  return { kind: "betting", bet: defaultBet(coins), confirmAllIn: false };
}

export function isZeroCoinLoss(start: number, outcome: SlotPlayOutcome): boolean {
  return outcome.kind === "lose" && coinsAfter(start, outcome) === 0;
}

export function showEmptyCoin(coins: number): boolean {
  return coins < 1;
}

/** Downward travel only, clamped to the 280px throw. */
export function leverPullPx(startY: number, currentY: number): number {
  return Math.min(LEVER_MAX_PX, Math.max(0, currentY - startY));
}

export function leverShouldSpin(pullPx: number): boolean {
  return pullPx >= LEVER_SPIN_THRESHOLD_PX;
}

export function knobCenterY(pullPx: number): number {
  return LEVER_KNOB_REST_Y + Math.min(LEVER_MAX_PX, Math.max(0, pullPx));
}

export function pickSymbol(random: () => number): ReelSymbol {
  const r = random();
  const index = Math.min(SYMBOLS.length - 1, Math.max(0, Math.floor(r * SYMBOLS.length)));
  return SYMBOLS[index];
}

/** Each reel is independently 7, cherry, or bell at 1/3. 777 is 1/27. */
export function rollStops(random: () => number = Math.random): ReelStops {
  return [pickSymbol(random), pickSymbol(random), pickSymbol(random)];
}

export function isJackpot(stops: ReelStops): boolean {
  return stops.every((symbol) => symbol === "seven");
}

export function outcomeForStops(bet: number, stops: ReelStops): SlotPlayOutcome {
  if (isJackpot(stops)) return { kind: "win", bet };
  return { kind: "lose", bet };
}

export function coinsAfter(start: number, outcome: SlotPlayOutcome): number {
  if (outcome.kind === "skip") return start;
  if (outcome.kind === "lose") return start - outcome.bet;
  return start - outcome.bet + outcome.bet * WIN_PAYOUT_MULTIPLIER;
}

/** Coins shown in the top-right. The bet is deducted once the reels are spinning. */
export function displayCoins(start: number, view: SlotView): number {
  switch (view.kind) {
    case "betting":
    case "ready":
      return start;
    case "spinning":
      return start - view.bet;
    case "result":
      return coinsAfter(start, view.outcome);
  }
}

export function reelStopAt(index: 0 | 1 | 2): number {
  return REEL_SPIN_ALL_MS + index * REEL_STOP_STAGGER_MS;
}

export function allReelsSettledAt(): number {
  return reelStopAt(2) + REEL_STOP_EASE_MS;
}

export function topicParticle(name: string): "은" | "는" {
  const last = name.at(-1);
  if (!last) return "은";
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "은";
  return (code - 0xac00) % 28 === 0 ? "는" : "은";
}
