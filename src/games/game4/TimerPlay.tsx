import { useEffect, useRef, useState } from "react";
import { copy } from "../../copy.ts";
import { AUTO_STOP_MS } from "../catalog.ts";
import { headerGameTitle } from "../catalog.ts";
import type { GameContext } from "../types.ts";
import type { TurnResult } from "../../state/types.ts";
import { Card } from "../../ui/Card.tsx";
import { Header } from "../../ui/Header.tsx";
import { PrimaryButton } from "../../ui/PrimaryButton.tsx";
import { ResultOverlay } from "../game1/ResultOverlay.tsx";
import { formatClock, formatDiffLabel, formatStoppedCaption, initialTimerPhase, isAutoStop } from "./timer.ts";
import type { TimerFixture } from "./fixtures.ts";
import "./timer.css";

const gameCopy = {
  stop: "멈춤",
  stopped: "멈췄어요",
  autoStop: "자동 멈춤",
  hiddenTitle: "숫자는 가려져 있어요",
  hiddenCaption: "시작부터 끝까지 숫자를 보여 주지 않아요",
} as const;

export function TimerPlay(props: {
  gameId: 4 | 5;
  context: GameContext;
  onFinish: (result: TurnResult) => void;
  fixture?: TimerFixture | null;
}) {
  const hidden = props.gameId === 5;
  const fixture = props.fixture;
  const [phase, setPhase] = useState<"ready" | "running" | "stopped" | "autostop">(
    initialTimerPhase(fixture),
  );
  const [elapsedMs, setElapsedMs] = useState(fixture?.elapsedMs ?? 0);
  const startedAt = useRef<number | null>(null);
  const frozen = Boolean(fixture);

  useEffect(() => {
    if (frozen || phase !== "running") return;
    startedAt.current = performance.now() - elapsedMs;
    let frame = 0;
    const tick = () => {
      const start = startedAt.current ?? performance.now();
      const next = Math.min(AUTO_STOP_MS, performance.now() - start);
      setElapsedMs(next);
      if (next >= AUTO_STOP_MS) {
        setPhase("autostop");
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // elapsedMs is only the start offset when this effect begins
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frozen, phase]);

  function start() {
    if (phase !== "ready") return;
    setElapsedMs(0);
    setPhase("running");
  }

  function stop() {
    if (phase !== "running") return;
    const startAt = startedAt.current;
    const now = startAt === null ? elapsedMs : Math.min(AUTO_STOP_MS, performance.now() - startAt);
    setElapsedMs(now);
    setPhase(isAutoStop(now) ? "autostop" : "stopped");
  }

  const ended = phase === "stopped" || phase === "autostop";
  const showClock = !hidden || ended;
  const backdropLabel = ended ? backdropText(props.gameId, phase) : null;

  return (
    <>
      <Header
        title={headerGameTitle(props.gameId)}
        meta={copy.turnProgressWithTeam(props.context.turnIndex + 1, props.context.names[props.context.team])}
      />
      <Card
        x={360}
        y={290}
        w={1200}
        h={340}
        radius={40}
        shadow
        fill={showClock ? "var(--color-surface-card)" : "var(--color-header-bar)"}
      />
      {showClock ? (
        <div className="timer-clock">{formatClock(elapsedMs)}</div>
      ) : (
        <>
          <div className="timer-hidden-title">{gameCopy.hiddenTitle}</div>
          <div className="timer-hidden-caption">{gameCopy.hiddenCaption}</div>
        </>
      )}
      {backdropLabel ? <div className="timer-card-label">{backdropLabel}</div> : null}
      {phase === "ready" ? (
        <PrimaryButton
          label={copy.start}
          size="wideLg"
          onClick={start}
          style={{ left: 660, top: 760, width: 600, height: 180, borderRadius: 90, fontSize: 64, lineHeight: "77px" }}
        />
      ) : phase === "running" ? (
        <PrimaryButton
          label={gameCopy.stop}
          size="wideLg"
          onClick={stop}
          style={{ left: 660, top: 760, width: 600, height: 180, borderRadius: 90, fontSize: 64, lineHeight: "77px" }}
        />
      ) : null}
      {ended ? (
        <ResultOverlay
          variant="time"
          title={copy.timeDiffLabel}
          value={formatDiffLabel(elapsedMs)}
          caption={formatStoppedCaption(elapsedMs)}
          onReveal={() => props.onFinish({ kind: "timeDiff", stoppedAtMs: Math.round(elapsedMs), autoStopped: phase === "autostop" })}
        />
      ) : null}
    </>
  );
}

function backdropText(gameId: 4 | 5, phase: "stopped" | "autostop"): string | null {
  if (phase === "autostop" && gameId === 5) return gameCopy.autoStop;
  if (phase === "stopped") return gameCopy.stopped;
  return null;
}
