import { copy } from "../../copy.ts";
import type { SlotModule } from "../types.ts";
import { Header } from "../../ui/Header.tsx";
import { PrimaryButton } from "../../ui/PrimaryButton.tsx";

export const slotGame: SlotModule = {
  id: "slot",
  Play({ context, onFinish }) {
    return (
      <>
        <Header title={copy.destinysLever} meta={context.names[context.team]} />
        <PrimaryButton
          label={copy.skipAction}
          size="md"
          onClick={() => onFinish({ kind: "skip" })}
          style={{ left: 760, top: 860 }}
        />
      </>
    );
  },
  Done({ onRevealFinal }) {
    return (
      <>
        <Header title={copy.destinysLever} meta={copy.afterFiveRounds} />
        <PrimaryButton
          label={copy.revealFinal}
          size="wideMd"
          onClick={onRevealFinal}
          style={{ left: 710, top: 860 }}
        />
      </>
    );
  },
};
