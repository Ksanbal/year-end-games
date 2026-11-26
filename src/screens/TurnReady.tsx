import { copy } from "../copy.ts";
import { headerGameTitle } from "../games/catalog.ts";
import type { RoundNumber, TeamIndex, TurnIndex } from "../state/types.ts";
import { Header } from "../ui/Header.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";
import { TeamName } from "./TeamName.tsx";

export function TurnReady(props: {
  round: RoundNumber;
  turnIndex: TurnIndex;
  team: TeamIndex;
  names: [string, string, string];
  onStart: () => void;
}) {
  return (
    <>
      <Header title={headerGameTitle(props.round)} />
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
      <TeamName
        name={props.names[props.team]}
        width={1760}
        startFontSize={104}
        startLineHeight={125}
        boxHeight={125}
        align="center"
        className="text-display"
        style={{ left: 80, top: 310 }}
      />
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
