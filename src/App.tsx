import { useCallback } from "react";
import { gameByRound } from "./games/catalog.ts";
import { getGame, getSlot } from "./games/registry.ts";
import { readJump } from "./jump.ts";
import { FinalResult } from "./screens/FinalResult.tsx";
import { Opening } from "./screens/Opening.tsx";
import { Recovery } from "./screens/Recovery.tsx";
import { RoundIntro } from "./screens/RoundIntro.tsx";
import { RoundResultScreen } from "./screens/RoundResult.tsx";
import { Shuffle } from "./screens/Shuffle.tsx";
import { SlotIntro } from "./screens/SlotIntro.tsx";
import { TeamSetup } from "./screens/TeamSetup.tsx";
import { TurnReady } from "./screens/TurnReady.tsx";
import { TurnResultScreen } from "./screens/TurnResult.tsx";
import { useSession } from "./session.ts";
import { nameReady, duplicateIndexes } from "./state/names.ts";
import { randomOrder } from "./state/reducer.ts";
import { slotOrder } from "./state/scoring.ts";
import type { TeamIndex } from "./state/types.ts";
import { Canvas } from "./ui/Canvas.tsx";
import { Clouds } from "./ui/Clouds.tsx";
import { Sky } from "./ui/Sky.tsx";
import "./ui/chrome.css";
import "./styles/screens.css";

export default function App() {
  const jump = readJump();
  const { state, dispatch, recovery, dismissRecovery } = useSession(jump);

  const startRound = useCallback(() => {
    dispatch({ type: "START_ROUND", order: randomOrder() });
  }, [dispatch]);

  const settleShuffle = useCallback(() => {
    dispatch({ type: "SHUFFLE_SETTLED" });
  }, [dispatch]);

  const phase = state.phase;
  const body = recovery ? (
    <Recovery state={state} onContinue={dismissRecovery} />
  ) : (
    <GameScreen
      state={state}
      dispatch={dispatch}
      startRound={startRound}
      settleShuffle={settleShuffle}
    />
  );

  return (
    <Canvas>
      <Sky />
      <Clouds />
      <div className="screen" key={recovery ? "recovery" : phaseKey(phase)}>
        {body}
      </div>
    </Canvas>
  );
}

function GameScreen(props: {
  state: ReturnType<typeof useSession>["state"];
  dispatch: ReturnType<typeof useSession>["dispatch"];
  startRound: () => void;
  settleShuffle: () => void;
}) {
  const { state, dispatch } = props;
  const phase = state.phase;

  switch (phase.kind) {
    case "opening":
      return <Opening onPickTeams={() => dispatch({ type: "START_SETUP" })} />;
    case "teamSetup":
      return (
        <TeamSetup
          names={state.teams}
          errors={duplicateIndexes(state.teams)}
          canStart={nameReady(state.teams)}
          onChange={(index, name) => dispatch({ type: "SET_TEAM_NAME", index, name })}
          onStart={() => dispatch({ type: "START_GAME" })}
        />
      );
    case "roundIntro":
      return <RoundIntro round={phase.round} onStart={props.startRound} />;
    case "shuffle": {
      const record = state.rounds[phase.round];
      if (!record) return null;
      return (
        <Shuffle
          round={phase.round}
          settled={phase.settled}
          order={record.order}
          names={state.teams}
          onSettled={props.settleShuffle}
          onNext={() => dispatch({ type: "ADVANCE_FROM_SHUFFLE" })}
        />
      );
    }
    case "turnReady": {
      const record = state.rounds[phase.round];
      if (!record) return null;
      return (
        <TurnReady
          round={phase.round}
          turnIndex={phase.turnIndex}
          team={record.order[phase.turnIndex]}
          names={state.teams}
          onStart={() => dispatch({ type: "BEGIN_TURN" })}
        />
      );
    }
    case "playing": {
      const record = state.rounds[phase.round];
      if (!record) return null;
      const game = getGame(gameByRound(phase.round).id);
      return game.Play({
        context: {
          names: state.teams,
          team: record.order[phase.turnIndex],
          turnIndex: phase.turnIndex,
          coins: state.coins,
        },
        onFinish: (result) => dispatch({ type: "FINISH_TURN", result }),
      });
    }
    case "turnResult": {
      const record = state.rounds[phase.round];
      if (!record) return null;
      return (
        <TurnResultScreen
          round={phase.round}
          turnIndex={phase.turnIndex}
          record={record}
          names={state.teams}
          onNextTurn={() => dispatch({ type: "ADVANCE_FROM_TURN_RESULT" })}
          onReveal={() => dispatch({ type: "REVEAL_ROUND" })}
        />
      );
    }
    case "roundResult": {
      const record = state.rounds[phase.round];
      if (!record) return null;
      return (
        <RoundResultScreen
          round={phase.round}
          record={record}
          names={state.teams}
          coins={state.coins}
          onNext={() => dispatch({ type: "ADVANCE_FROM_ROUND_RESULT" })}
        />
      );
    }
    case "slotIntro": {
      const order =
        state.slotOrder ??
        slotOrder({
          coins: state.coins,
          lastRoundRank: () => 3,
        });
      return (
        <SlotIntro
          names={state.teams}
          coins={state.coins}
          order={order}
          onStart={() => dispatch({ type: "START_SLOT" })}
        />
      );
    }
    case "slotTurn": {
      const slot = getSlot();
      const team = state.slotOrder?.[phase.orderIndex] ?? (0 as TeamIndex);
      return slot.Play({
        context: {
          names: state.teams,
          coins: state.coins,
          team,
          orderIndex: phase.orderIndex,
        },
        onFinish: (outcome) => dispatch({ type: "FINISH_SLOT_TURN", outcome }),
      });
    }
    case "slotDone":
      return getSlot().Done({ onRevealFinal: () => dispatch({ type: "REVEAL_FINAL" }) });
    case "final":
      return (
        <FinalResult
          state={state}
          confirm={phase.confirmNewGame}
          onRequestNew={() => dispatch({ type: "REQUEST_NEW_GAME" })}
          onCancel={() => dispatch({ type: "CANCEL_NEW_GAME" })}
          onConfirm={() => dispatch({ type: "CONFIRM_NEW_GAME" })}
        />
      );
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

function phaseKey(phase: ReturnType<typeof useSession>["state"]["phase"]): string {
  switch (phase.kind) {
    case "roundIntro":
    case "roundResult":
      return `${phase.kind}-${phase.round}`;
    case "shuffle":
      return `${phase.kind}-${phase.round}-${phase.settled}`;
    case "turnReady":
    case "playing":
    case "turnResult":
      return `${phase.kind}-${phase.round}-${phase.turnIndex}`;
    case "slotTurn":
      return `${phase.kind}-${phase.orderIndex}`;
    case "final":
      return `${phase.kind}-${phase.confirmNewGame}`;
    default:
      return phase.kind;
  }
}

