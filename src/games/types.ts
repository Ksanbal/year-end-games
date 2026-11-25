import type { ReactNode } from "react";
import type { GameId } from "./catalog.ts";
import type { TeamIndex, TurnIndex, TurnResult, SlotOutcome } from "../state/types.ts";

export type GameContext = {
  names: [string, string, string];
  team: TeamIndex;
  turnIndex: TurnIndex;
  coins: [number, number, number];
};

export type GameModule = {
  id: GameId;
  Play: (props: { context: GameContext; onFinish: (result: TurnResult) => void }) => ReactNode;
};

export type SlotContext = {
  names: [string, string, string];
  coins: [number, number, number];
  team: TeamIndex;
  orderIndex: 0 | 1 | 2;
};

export type SlotModule = {
  id: "slot";
  Play: (props: { context: SlotContext; onFinish: (outcome: SlotOutcome) => void }) => ReactNode;
  Done: (props: { onRevealFinal: () => void }) => ReactNode;
};
