import { copy } from "../copy.ts";
import { gameByRound, headerGameTitle } from "../games/catalog.ts";
import { formatTurnScore } from "../format.ts";
import type { RoundRecord, RoundNumber, TeamIndex, TurnIndex, TurnResult } from "../state/types.ts";
import { Card } from "../ui/Card.tsx";
import { Header } from "../ui/Header.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";

export function TurnResultScreen(props: {
  round: RoundNumber;
  turnIndex: TurnIndex;
  record: RoundRecord;
  names: [string, string, string];
  onNextTurn: () => void;
  onReveal: () => void;
}) {
  const team = props.record.order[props.turnIndex];
  const result = props.record.results[props.turnIndex];
  if (!result) return null;
  const last = props.turnIndex === 2;
  const subtitle = scoreSubtitle(props.round, result);

  return (
    <>
      <Header title={headerGameTitle(props.round)} meta={copy.turnProgress(props.turnIndex + 1)} />
      <div
        className="text-display text-center"
        style={{
          position: "absolute",
          left: 0,
          top: 170,
          width: 1920,
          height: 58,
          fontSize: 48,
          lineHeight: "58px",
          color: "var(--color-text-secondary)",
        }}
      >
        {copy.turnResultTitle(props.names[team])}
      </div>
      <div
        className="text-display text-center"
        style={{ position: "absolute", left: 0, top: 230, width: 1920, height: 216, fontSize: 180, lineHeight: "216px" }}
      >
        {formatTurnScore(result)}
      </div>
      {subtitle ? (
        <div
          className="text-ui text-center"
          style={{
            position: "absolute",
            left: 0,
            top: 450,
            width: 1920,
            height: 43,
            fontSize: 36,
            fontWeight: 500,
            lineHeight: "43px",
            color: "var(--color-text-secondary)",
          }}
        >
          {subtitle}
        </div>
      ) : null}
      <Card x={460} y={540} w={1000} h={300} radius={36} shadow>
        {([0, 1, 2] as const).map((turn) => (
          <TurnRow
            key={turn}
            turn={turn}
            team={props.record.order[turn]}
            name={props.names[props.record.order[turn] as TeamIndex]}
            result={props.record.results[turn]}
          />
        ))}
      </Card>
      {last ? (
        <PrimaryButton
          label={copy.revealResults}
          size="wideMd"
          onClick={props.onReveal}
          style={{ left: 710, top: 900 }}
        />
      ) : (
        <PrimaryButton label={copy.nextTurn} size="md" onClick={props.onNextTurn} style={{ left: 760, top: 900 }} />
      )}
    </>
  );
}

function scoreSubtitle(round: RoundNumber, result: TurnResult): string | null {
  if (result.kind === "timeDiff") return copy.timeDiffLabel;
  if (gameByRound(round).id === 1) return copy.openTileCount;
  return null;
}

function TurnRow(props: {
  turn: TurnIndex;
  team: TeamIndex;
  name: string;
  result: TurnResult | null;
}) {
  const top = 35 + props.turn * 90;
  return (
    <>
      <div
        className="text-ui"
        style={{
          position: "absolute",
          left: 60,
          top: top + 3,
          fontSize: 32,
          fontWeight: 500,
          lineHeight: "38px",
          color: "var(--color-text-secondary)",
        }}
      >
        {copy.turnLabel(props.turn)}
      </div>
      <div
        className="text-display"
        style={{ position: "absolute", left: 300, top, fontSize: 36, lineHeight: "43px" }}
      >
        {props.name}
      </div>
      <div
        className="text-display"
        style={{ position: "absolute", left: 640, top, width: 300, textAlign: "right", fontSize: 36, lineHeight: "43px" }}
      >
        {props.result ? formatTurnScore(props.result) : copy.waiting}
      </div>
    </>
  );
}
