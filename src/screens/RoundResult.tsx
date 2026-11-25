import { copy } from "../copy.ts";
import { headerGameTitle } from "../games/catalog.ts";
import { formatTurnScore } from "../format.ts";
import { rankTeams, type Standing } from "../state/scoring.ts";
import type { RoundRecord, RoundNumber } from "../state/types.ts";
import { Card } from "../ui/Card.tsx";
import { Header } from "../ui/Header.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";

export function RoundResultScreen(props: {
  round: RoundNumber;
  record: RoundRecord;
  names: [string, string, string];
  coins: [number, number, number];
  onNext: () => void;
}) {
  const filled = props.record.results.flatMap((result, turn) =>
    result ? [{ team: props.record.order[turn], result }] : [],
  );
  const standings = rankTeams(filled);

  return (
    <>
      <Header title={headerGameTitle(props.round)} meta={copy.headerRoundResult} />
      <div
        className="text-display text-center"
        style={{ position: "absolute", left: 0, top: 160, width: 1920, height: 86, fontSize: 72, lineHeight: "86px" }}
      >
        {copy.roundResultTitle(props.round)}
      </div>
      <div className="text-ui" style={{ position: "absolute", left: 300, top: 290, fontSize: 30, fontWeight: 700, lineHeight: "36px", color: "var(--color-text-secondary)" }}>
        {copy.colRank}
      </div>
      <div className="text-ui" style={{ position: "absolute", left: 520, top: 290, fontSize: 30, fontWeight: 700, lineHeight: "36px", color: "var(--color-text-secondary)" }}>
        {copy.colTeam}
      </div>
      <div className="text-ui" style={{ position: "absolute", left: 960, top: 290, fontSize: 30, fontWeight: 700, lineHeight: "36px", color: "var(--color-text-secondary)" }}>
        {copy.colScore}
      </div>
      <div className="text-ui" style={{ position: "absolute", left: 1180, top: 290, fontSize: 30, fontWeight: 700, lineHeight: "36px", color: "var(--color-text-secondary)" }}>
        {copy.colCoinsGained}
      </div>
      <div className="text-ui" style={{ position: "absolute", left: 1440, top: 290, fontSize: 30, fontWeight: 700, lineHeight: "36px", color: "var(--color-text-secondary)" }}>
        {copy.colCoinsTotal}
      </div>
      {standings.map((row, i) => (
        <ResultRow key={row.team} index={i} standing={row} name={props.names[row.team]} coins={props.coins[row.team]} />
      ))}
      <PrimaryButton label={copy.nextRound} size="md" onClick={props.onNext} style={{ left: 760, top: 900 }} />
    </>
  );
}


function ResultRow(props: { index: number; standing: Standing; name: string; coins: number }) {
  const y = 340 + props.index * 150;
  const highlight = props.standing.rank === 1;
  return (
    <Card x={260} y={y} w={1400} h={130} radius={highlight ? 24 : 36} highlight={highlight} shadow>
      <div className="text-display" style={{ position: "absolute", left: 40, top: 30, fontSize: 56, lineHeight: "67px" }}>
        {copy.rank(props.standing.rank, props.standing.tied)}
      </div>
      <div className="text-display" style={{ position: "absolute", left: 260, top: 36, fontSize: 48, lineHeight: "58px" }}>
        {props.name}
      </div>
      <div className="text-display" style={{ position: "absolute", left: 700, top: 40, fontSize: 44, lineHeight: "53px" }}>
        {formatTurnScore(props.standing.result)}
      </div>
      <div className="text-display" style={{ position: "absolute", left: 920, top: 36, fontSize: 48, lineHeight: "58px", color: "var(--color-text-accent)" }}>
        {copy.coinsDelta(props.standing.coins)}
      </div>
      <div className="text-display" style={{ position: "absolute", left: 1180, top: 40, fontSize: 44, lineHeight: "53px" }}>
        {props.coins}
      </div>
    </Card>
  );
}
