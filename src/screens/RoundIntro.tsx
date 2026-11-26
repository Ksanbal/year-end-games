import { copy } from "../copy.ts";
import { introGameTitle } from "../games/catalog.ts";
import type { RoundNumber } from "../state/types.ts";
import { Coin } from "../ui/Coin.tsx";
import { Header } from "../ui/Header.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";

export function RoundIntro({ round, onStart }: { round: RoundNumber; onStart: () => void }) {
  return (
    <>
      <Header title={copy.roundOfFive(round)} />
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
      <div className="round-intro-line text-ui">{copy.threeTeamsPlayOnce}</div>
      <div className="round-progress" aria-label={copy.roundOfFive(round)}>
        <div className="round-progress-line" />
        {([1, 2, 3, 4, 5] as const).map((number) => (
          <div key={number} className={`round-progress-dot ${number < round ? "is-past" : number === round ? "is-current" : "is-future"}`}>
            {number === round ? <span className="round-progress-ring" /> : null}<span>{number}</span>
          </div>
        ))}
        <Coin size={36} style={{ position: "relative" }} />
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

