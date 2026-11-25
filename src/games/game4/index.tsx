import { copy } from "../../copy.ts";
import { headerGameTitle } from "../catalog.ts";
import type { GameModule } from "../types.ts";
import { Header } from "../../ui/Header.tsx";
import { PrimaryButton } from "../../ui/PrimaryButton.tsx";

export const game4: GameModule = {
  id: 4,
  Play({ context, onFinish }) {
    return (
      <>
        <Header
          title={headerGameTitle(4)}
          meta={copy.turnProgressWithTeam(context.turnIndex + 1, context.names[context.team])}
        />
        <PrimaryButton
          label={copy.revealResults}
          size="wideMd"
          onClick={() => onFinish({ kind: "timeDiff", stoppedAtMs: 10000, autoStopped: false })}
          style={{ left: 710, top: 860 }}
        />
      </>
    );
  },
};
