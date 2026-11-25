import { copy } from "../../copy.ts";
import { headerGameTitle } from "../catalog.ts";
import type { GameModule } from "../types.ts";
import { Header } from "../../ui/Header.tsx";
import { PrimaryButton } from "../../ui/PrimaryButton.tsx";

export const game1: GameModule = {
  id: 1,
  Play({ context, onFinish }) {
    return (
      <>
        <Header
          title={headerGameTitle(1)}
          meta={copy.turnProgressWithTeam(context.turnIndex + 1, context.names[context.team])}
        />
        <PrimaryButton
          label={copy.revealResults}
          size="wideMd"
          onClick={() => onFinish({ kind: "score", score: 0 })}
          style={{ left: 710, top: 860 }}
        />
      </>
    );
  },
};
