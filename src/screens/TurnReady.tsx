import { copy } from "../copy.ts";
import { headerGameTitle } from "../games/catalog.ts";
import type { RoundNumber, TeamIndex, TurnIndex } from "../state/types.ts";
import { Header } from "../ui/Header.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";

export function TurnReady(props: {
  round: RoundNumber;
  turnIndex: TurnIndex;
  team: TeamIndex;
  names: [string, string, string];
  onStart: () => void;
}) {
  return (
    <>
      <Header title={headerGameTitle(props.round)} meta={copy.turnProgress(props.turnIndex + 1)} />
      <div
        className="text-display text-center"
        style={{
          position: "absolute",
          left: 0,
          top: 240,
          width: 1920,
          height: 53,
          fontSize: 44,
          lineHeight: "53px",
          color: "var(--color-text-secondary)",
        }}
      >
        {copy.turnLabel(props.turnIndex)}
      </div>
      <div
        className="text-display text-center"
        style={{ position: "absolute", left: 0, top: 310, width: 1920, height: 125, fontSize: 104, lineHeight: "125px" }}
      >
        {props.names[props.team]}
      </div>
      <div
        className="text-display text-center"
        style={{
          position: "absolute",
          left: 0,
          top: 470,
          width: 1920,
          height: 48,
          fontSize: 40,
          lineHeight: "48px",
          color: "var(--color-text-secondary)",
        }}
      >
        {copy.readyHint}
      </div>
      <PrimaryButton label={copy.start} onClick={props.onStart} style={{ left: 760, top: 860 }} />
    </>
  );
}
