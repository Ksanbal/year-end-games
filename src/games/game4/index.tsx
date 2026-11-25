import type { GameModule } from "../types.ts";
import { screenCode, timerFixture } from "./fixtures.ts";
import { TimerPlay } from "./TimerPlay.tsx";

export const game4: GameModule = {
  id: 4,
  Play(props) {
    return <TimerPlay gameId={4} context={props.context} onFinish={props.onFinish} fixture={timerFixture(screenCode())} />;
  },
};
