import type { GameModule } from "../types.ts";
import { COUNTRIES } from "./countries.ts";
import { screenCode, wordFixture } from "./fixtures.ts";
import { WordPlay } from "./WordPlay.tsx";

export const game2: GameModule = {
  id: 2,
  Play(props) {
    const fixture = wordFixture(screenCode());
    return (
      <WordPlay
        gameId={2}
        context={props.context}
        onFinish={props.onFinish}
        problems={COUNTRIES}
        fixture={fixture}
        persistUsed={!fixture && screenCode() === null}
      />
    );
  },
};
