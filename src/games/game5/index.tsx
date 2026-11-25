import type { GameModule } from "../types.ts";
import { screenCode, timerFixture } from "../game4/fixtures.ts";
import { TimerPlay } from "../game4/TimerPlay.tsx";

export const game5: GameModule = {
  id: 5,
  Play(props) {
    return <TimerPlay gameId={5} context={props.context} onFinish={props.onFinish} fixture={timerFixture(screenCode())} />;
  },
};
