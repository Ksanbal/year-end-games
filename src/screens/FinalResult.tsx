import type { CSSProperties } from "react";
import { copy } from "../copy.ts";
import { formatRoundCell, formatSlotCell, minusSign } from "../format.ts";
import { rankFinal, rankTeams } from "../state/scoring.ts";
import type { AppState, RoundNumber, TeamIndex } from "../state/types.ts";
import { Card } from "../ui/Card.tsx";
import { Coin } from "../ui/Coin.tsx";
import { FlatButton } from "../ui/FlatButton.tsx";
import { ConfettiBurst } from "../ui/Confetti.tsx";
import { useFinalTitleFit } from "./finalTitle.ts";
import { TeamName } from "./TeamName.tsx";
import { columnWidth } from "./teamName.ts";

export function FinalResult(props: {
  state: AppState;
  confirm: boolean;
  onRequestNew: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const standings = rankFinal(props.state.coins);
  const winners = standings.filter((row) => row.rank === 1);
  const tiedFirst = winners.length > 1;
  const title = tiedFirst
    ? copy.finalTiedChampion(winners.map((row) => props.state.teams[row.team]))
    : copy.finalChampion(props.state.teams[winners[0].team]);
  // Figma 10-3 (188:73) moves the team column to x=340 for the wider "공동 1등" label.
  const teamColX = tiedFirst ? 340 : 300;
  const titleFit = useFinalTitleFit(title, true);

  return (
    <>
      <ConfettiBurst />
      <div
        className={titleFit.ready ? "final-title-row text-display" : "final-title-row text-display is-pending"}
        data-final-title-ready={titleFit.ready ? "true" : "false"}
        data-font-size={String(titleFit.fontSize)}
        data-show-coins={titleFit.showCoins ? "true" : "false"}
        style={{ fontSize: titleFit.fontSize, lineHeight: `${(titleFit.fontSize * 96) / 80}px` }}
      >
        {titleFit.showCoins ? <Coin size={72} left={0} top={0} /> : null}
        <span className="final-title-text">{title}</span>
        {titleFit.showCoins ? <Coin size={72} left={0} top={0} /> : null}
      </div>
      <div
        className="text-ui text-center"
        style={{
          position: "absolute",
          left: 0,
          top: 190,
          width: 1920,
          height: 38,
          fontSize: 32,
          fontWeight: 500,
          lineHeight: "38px",
          color: "var(--color-text-secondary)",
        }}
      >
        {copy.prizeNote}
      </div>
      <div className="text-ui" style={{ position: "absolute", left: teamColX, top: 320, fontSize: 28, fontWeight: 700, lineHeight: "34px", color: "var(--color-text-secondary)" }}>
        {copy.colTeam}
      </div>
      {([1, 2, 3, 4, 5] as const).map((round) => (
        <div
          key={round}
          className="text-ui"
          style={{
            position: "absolute",
            left: 360 + round * 180,
            top: 320,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: "34px",
            color: "var(--color-text-secondary)",
          }}
        >
          {copy.colRound(round)}
        </div>
      ))}
      <div className="text-ui" style={{ position: "absolute", left: 1440, top: 320, fontSize: 28, fontWeight: 700, lineHeight: "34px", color: "var(--color-text-secondary)" }}>
        {copy.destinysLever}
      </div>
      <div className="text-ui" style={{ position: "absolute", left: 1660, top: 320, fontSize: 28, fontWeight: 700, lineHeight: "34px", color: "var(--color-text-secondary)" }}>
        {copy.colFinalCoins}
      </div>
      {standings.map((row, i) => (
        <div key={row.team} className="result-row-reveal" style={{ "--row-index": i } as CSSProperties}><FinalRow index={i} team={row.team} standing={row} state={props.state} teamColX={teamColX} /></div>
      ))}
      <div
        className="text-ui text-center"
        style={{
          position: "absolute",
          left: 0,
          top: 850,
          width: 1920,
          height: 34,
          fontSize: 28,
          fontWeight: 500,
          lineHeight: "34px",
          color: "var(--color-text-secondary)",
        }}
      >
        {copy.teamOnlyNote}
      </div>
      <FlatButton
        label={copy.newGame}
        width={280}
        height={100}
        fontSize={40}
        onClick={props.onRequestNew}
        style={{ left: 80, top: 870 }}
      />
      {props.confirm ? (
        <ConfirmNewGame onCancel={props.onCancel} onConfirm={props.onConfirm} />
      ) : null}
    </>
  );
}

function FinalRow(props: {
  index: number;
  team: TeamIndex;
  standing: ReturnType<typeof rankFinal>[number];
  state: AppState;
  teamColX: number;
}) {
  const y = 370 + props.index * 150;
  const highlight = props.standing.rank === 1;
  const slot = formatSlotCell(props.state.slotOutcomes[props.team], props.state.previousSlotDelta?.[props.team]);
  return (
    <Card x={120} y={y} w={1680} h={130} radius={highlight ? 24 : 36} highlight={highlight} shadow>
      <div className="text-display" style={{ position: "absolute", left: 30, top: 36, fontSize: 48, lineHeight: "58px" }}>
        {copy.rank(props.standing.rank, props.standing.tied)}
      </div>
      <TeamName
        name={props.state.teams[props.team]}
        width={columnWidth(props.teamColX - 120, 420)}
        startFontSize={36}
        startLineHeight={43}
        boxHeight={130}
        className="text-display"
        style={{ left: props.teamColX - 120, top: 0 }}
      />
      {([1, 2, 3, 4, 5] as const).map((round) => (
        <div
          key={round}
          className="text-ui"
          style={{
            position: "absolute",
            left: 240 + round * 180,
            top: 48,
            fontSize: 30,
            fontWeight: 500,
            lineHeight: "36px",
          }}
        >
          {roundCell(props.state, props.team, round)}
        </div>
      ))}
      <div
        className="text-ui"
        style={{ position: "absolute", left: 1320, top: 48, fontSize: 30, fontWeight: 500, lineHeight: "36px" }}
      >
        {minusSign(slot).map((part, i) => (
          <span key={i} style={{ fontFamily: part.font === "ui" ? "var(--font-ui)" : "var(--font-display)", fontWeight: part.font === "ui" ? 700 : 400 }}>
            {part.text}
          </span>
        ))}
      </div>
      <div
        className="text-display"
        style={{ position: "absolute", left: 1540, top: 34, fontSize: 52, lineHeight: "62px", color: "var(--color-text-accent)" }}
      >
        {props.standing.coins}
      </div>
    </Card>
  );
}

function roundCell(state: AppState, team: TeamIndex, round: RoundNumber): string {
  const record = state.rounds[round];
  if (!record) return "";
  const filled = record.results.flatMap((result, turn) =>
    result ? [{ team: record.order[turn], result }] : [],
  );
  if (filled.length < 3) return "";
  const standing = rankTeams(filled).find((row) => row.team === team);
  return standing ? formatRoundCell(standing) : "";
}

function ConfirmNewGame(props: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="dim">
      <div
        className="card-shadow"
        style={{ left: 560, top: 270, width: 800, height: 540, borderRadius: 40, background: "var(--color-shadow-on-dim)" }}
      />
      <div
        className="card-face"
        style={{ left: 560, top: 260, width: 800, height: 540, borderRadius: 40, zIndex: 6 }}
      />
      <div
        className="text-display text-center"
        style={{ position: "absolute", left: 560, top: 310, width: 800, height: 58, fontSize: 48, lineHeight: "58px", zIndex: 7 }}
      >
        {copy.confirmNewGame}
      </div>
      <div
        className="text-ui text-center"
        style={{
          position: "absolute",
          left: 620,
          top: 395,
          width: 680,
          height: 72,
          fontSize: 30,
          fontWeight: 500,
          lineHeight: "36px",
          color: "var(--color-text-secondary)",
          zIndex: 7,
        }}
      >
        {copy.confirmNewGameBody}
      </div>
      <FlatButton label={copy.cancel} width={340} height={112} fontSize={45} onClick={props.onCancel} style={{ left: 600, top: 600, zIndex: 7 }} />
      <FlatButton
        label={copy.eraseAndNewGame}
        width={340}
        height={112}
        fontSize={45}
        onClick={props.onConfirm}
        style={{ left: 980, top: 600, zIndex: 7 }}
      />
    </div>
  );
}
