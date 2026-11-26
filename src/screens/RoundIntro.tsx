import { copy } from "../copy.ts";
import { introGameTitle } from "../games/catalog.ts";
import type { RoundNumber } from "../state/types.ts";
import { Header } from "../ui/Header.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";

export function RoundIntro({ round, onStart }: { round: RoundNumber; onStart: () => void }) {
  return (
    <>
      <Header title={copy.roundOfFive(round)} variant="plain" />
      <div
        className="text-display text-center"
        style={{
          position: "absolute",
          left: 0,
          top: 380,
          width: 1920,
          height: 53,
          fontSize: 44,
          lineHeight: "53px",
          color: "var(--color-text-secondary)",
        }}
      >
        {copy.roundLabel(round)}
      </div>
      <div
        className="text-display text-center"
        style={{ position: "absolute", left: 0, top: 450, width: 1920, height: 115, fontSize: 96, lineHeight: "115px" }}
      >
        {introGameTitle(round)}
      </div>
      <PrimaryButton
        label={copy.startRound}
        size="wideLg"
        onClick={onStart}
        style={{ left: 740, top: 860 }}
      />
    </>
  );
}

