import { copy } from "../copy.ts";
import { GAMES, introGameTitle } from "../games/catalog.ts";

export type GameIntroRow = {
  label: string;
  name: string;
  showCoin?: boolean;
};

export function gameIntroRows(): GameIntroRow[] {
  return [
    ...GAMES.map((game) => ({
      label: copy.roundLabel(game.id),
      name: introGameTitle(game.id),
    })),
    { label: copy.afterFiveRounds, name: copy.destinysLever, showCoin: true },
  ];
}
