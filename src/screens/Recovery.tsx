import { copy } from "../copy.ts";
import { headerGameTitle } from "../games/catalog.ts";
import type { AppState } from "../state/types.ts";
import { Card } from "../ui/Card.tsx";
import { Header } from "../ui/Header.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";
import { TeamName } from "./TeamName.tsx";

export function Recovery({ state, onContinue }: { state: AppState; onContinue: () => void }) {
  const lines = recoveryLines(state);
  return (
    <>
      <Header title={copy.appTitle} />
      <div
        className="text-display text-center"
        style={{ position: "absolute", left: 0, top: 220, width: 1920, height: 86, fontSize: 72, lineHeight: "86px" }}
      >
        {copy.recoveredTitle}
      </div>
      <Card x={460} y={350} w={1000} h={330} radius={36} shadow>
        <div className="text-display text-center" style={{ paddingTop: 40, fontSize: 44, lineHeight: "53px" }}>
          {lines[0]}
        </div>
        {lines[1] ? (
          <div style={{ position: "relative", height: 96, marginTop: 17 }}>
            <TeamName
              name={lines[1]}
              width={952}
              startFontSize={40}
              startLineHeight={48}
              boxHeight={96}
              align="center"
              className="text-display"
              style={{ left: 24, top: 0 }}
            />
          </div>
        ) : null}
        <div
          className="text-ui text-center"
          style={{
            position: "absolute",
            left: 0,
            top: 250,
            width: 1000,
            fontSize: 28,
            fontWeight: 500,
            lineHeight: "34px",
            color: "var(--color-text-secondary)",
          }}
        >
          {copy.recoveredHint}
        </div>
      </Card>
      <PrimaryButton label={copy.continue} size="md" onClick={onContinue} style={{ left: 760, top: 860 }} />
    </>
  );
}

function recoveryLines(state: AppState): [string, string?] {
  const phase = state.phase;
  switch (phase.kind) {
    case "roundIntro":
    case "shuffle":
      return [headerGameTitle(phase.round)];
    case "turnReady":
    case "playing":
    case "turnResult": {
      const record = state.rounds[phase.round];
      const team = record?.order[phase.turnIndex] ?? 0;
      return [headerGameTitle(phase.round), copy.turnProgressWithTeam(phase.turnIndex + 1, state.teams[team])];
    }
    case "roundResult":
      return [headerGameTitle(phase.round), copy.headerRoundResult];
    case "slotIntro":
    case "slotTurn":
    case "slotDone":
      return [copy.destinysLever, slotLine(state)];
    case "final":
      return [copy.finalHeader];
    default:
      return [copy.appTitle];
  }
}

function slotLine(state: AppState): string | undefined {
  if (state.phase.kind !== "slotTurn" || !state.slotOrder) return undefined;
  const team = state.slotOrder[state.phase.orderIndex];
  return state.teams[team];
}
