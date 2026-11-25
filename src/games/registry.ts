import { game1 } from "./game1/index.tsx";
import { game2 } from "./game2/index.tsx";
import { game3 } from "./game3/index.tsx";
import { game4 } from "./game4/index.tsx";
import { game5 } from "./game5/index.tsx";
import { slotGame } from "./slot/index.tsx";
import type { GameId } from "./catalog.ts";
import type { GameModule, SlotModule } from "./types.ts";

const games: Record<GameId, GameModule> = {
  1: game1,
  2: game2,
  3: game3,
  4: game4,
  5: game5,
};

export function getGame(id: GameId): GameModule {
  return games[id];
}

export function getSlot(): SlotModule {
  return slotGame;
}

export { games };
