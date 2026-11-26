import { useMemo, useState } from "react";
import { headerGameTitle } from "../catalog.ts";
import type { GameModule } from "../types.ts";
import { Header } from "../../ui/Header.tsx";
import { openedScore, reveal, createBoard, SIZE, type Board } from "./board.ts";
import { fixtureBoard, screenCode } from "./fixtures.ts";
import { MineIcon } from "./MineIcon.tsx";
import { MixedTitle, ResultOverlay } from "./ResultOverlay.tsx";
import "./game1.css";

const PITCH = 168;
const ORIGIN_X = 628;
const ORIGIN_Y = 170;

const gameCopy = {
  boom: "✱ 지뢰가 터졌어요",
  cleared: "지뢰를 모두 피했어요",
  scoreLabel: "점수",
} as const;

export const game1: GameModule = {
  id: 1,
  Play(props) {
    return <Game1Play {...props} />;
  },
};

function Game1Play({ onFinish }: Parameters<GameModule["Play"]>[0]) {
    const fixture = useMemo(() => fixtureBoard(screenCode()), []);
    const [board, setBoard] = useState<Board>(() => fixture?.board ?? createBoard());
    const [explodedAt, setExplodedAt] = useState<number | null>(fixture?.explodedAt ?? null);
    const [ended, setEnded] = useState<"mine" | "cleared" | null>(fixture?.ended ?? null);
    const score = openedScore(board);
    const locked = ended !== null;

    function open(at: number) {
      if (locked) return;
      const result = reveal(board, at);
      setBoard(result.board);
      if (result.hitMine) {
        setExplodedAt(at);
        setEnded("mine");
      } else if (result.cleared) {
        setEnded("cleared");
      }
    }

    return (
      <>
        <Header title={headerGameTitle(1)} />
        {Array.from({ length: SIZE * SIZE }, (_, i) => {
          const col = i % SIZE;
          const row = Math.floor(i / SIZE);
          const x = ORIGIN_X + col * PITCH;
          const y = ORIGIN_Y + row * PITCH;
          const cell = board[i]!;
          const exploded = explodedAt === i;
          return (
            <Tile
              key={i}
              x={x}
              y={y}
              opened={cell.opened}
              mine={cell.mine}
              adjacent={cell.adjacent}
              exploded={exploded}
              disabled={locked || cell.opened}
              onOpen={() => open(i)}
            />
          );
        })}
        {ended ? (
          <ResultOverlay
            variant="mine"
            title={<MixedTitle text={ended === "mine" ? gameCopy.boom : gameCopy.cleared} />}
            label={gameCopy.scoreLabel}
            value={`${score}점`}
            onReveal={() => onFinish({ kind: "score", score })}
          />
        ) : null}
      </>
    );
}

function Tile(props: {
  x: number;
  y: number;
  opened: boolean;
  mine: boolean;
  adjacent: number;
  exploded: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  if (!props.opened) {
    return (
      <button type="button" className="mine-tile is-closed" style={{ left: props.x, top: props.y }} onClick={props.onOpen} disabled={props.disabled} />
    );
  }
  if (props.mine) {
    return (
      <>
        {props.exploded ? <div className="mine-ring" style={{ left: props.x - 9, top: props.y - 9 }} /> : null}
        <div
          className={props.exploded ? "mine-tile is-exploded" : "mine-tile is-mine"}
          style={{ left: props.x, top: props.y }}
        >
          <MineIcon />
        </div>
      </>
    );
  }
  const tone = props.adjacent === 0 ? "is-n0" : props.adjacent === 1 ? "is-n1" : props.adjacent === 2 ? "is-n2" : "is-n-more";
  return (
    <div className={`mine-tile is-open ${tone}`} style={{ left: props.x, top: props.y }}>
      {props.adjacent}
    </div>
  );
}
