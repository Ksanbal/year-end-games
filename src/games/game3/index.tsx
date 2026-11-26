import type { GameModule } from "../types.ts";
import { WordPlay } from "../game2/WordPlay.tsx";
import { idiomFixture, screenCode } from "./fixtures.ts";
import { IDIOMS } from "./idioms.ts";

export const game3: GameModule = {
  id: 3,
  Play(props) {
    const fixture = idiomFixture(screenCode());
    return (
      <WordPlay
        gameId={3}
        context={props.context}
        onFinish={props.onFinish}
        problems={IDIOMS}
        fixture={fixture}
        persistUsed={!fixture && screenCode() === null}
      />
    );
  },
};
