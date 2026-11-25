import { useEffect, useState } from "react";
import { copy } from "../copy.ts";
import { headerGameTitle } from "../games/catalog.ts";
import type { RoundNumber, TeamIndex } from "../state/types.ts";
import { Card } from "../ui/Card.tsx";
import { Header } from "../ui/Header.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";
import { TeamName } from "./TeamName.tsx";

const CARD_X = [180, 720, 1260];
const LABELS = [copy.firstTurn, copy.secondTurn, copy.thirdTurn];
const SHUFFLE_MS = 3000;
const TICK_MS = 120;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Shuffle(props: {
  round: RoundNumber;
  settled: boolean;
  order: [TeamIndex, TeamIndex, TeamIndex];
  names: [string, string, string];
  onSettled: () => void;
  onNext: () => void;
}) {
  const [rolling, setRolling] = useState<[TeamIndex, TeamIndex, TeamIndex]>([0, 1, 2]);

  useEffect(() => {
    if (props.settled) return;
    if (prefersReducedMotion()) {
      props.onSettled();
      return;
    }
    let tick = 0;
    const interval = window.setInterval(() => {
      tick += 1;
      setRolling([
        ((tick) % 3) as TeamIndex,
        ((tick + 1) % 3) as TeamIndex,
        ((tick + 2) % 3) as TeamIndex,
      ]);
    }, TICK_MS);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      props.onSettled();
    }, SHUFFLE_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [props.settled, props.onSettled]);

  return (
    <>
      <Header title={headerGameTitle(props.round)} />
      <div
        className="text-display text-center"
        style={{ position: "absolute", left: 0, top: 190, width: 1920, height: 86, fontSize: 72, lineHeight: "86px" }}
      >
        {props.settled ? copy.shuffleDone : copy.shuffling}
      </div>
      {CARD_X.map((x, i) => {
        const team = props.settled ? props.order[i] : rolling[i];
        const above = ((team + 2) % 3) as TeamIndex;
        const below = ((team + 1) % 3) as TeamIndex;
        return (
          <div key={i} style={{ display: "contents" }}>
            <div
              className="text-ui text-center"
              style={{
                position: "absolute",
                left: x,
                top: 330,
                width: 480,
                height: 38,
                fontSize: 32,
                fontWeight: 500,
                lineHeight: "38px",
                color: "var(--color-text-secondary)",
              }}
            >
              {LABELS[i]}
            </div>
            <Card
              x={x}
              y={390}
              w={480}
              h={300}
              radius={32}
              shadow={props.settled}
              highlight={props.settled}
              stroke={props.settled ? "var(--color-stroke-default)" : "var(--color-shuffle-stroke)"}
              strokeWidth={props.settled ? 6 : 4}
              fill={props.settled ? "var(--color-surface-highlight)" : "var(--color-shuffle-card)"}
            >
              {props.settled ? (
                <TeamName
                  name={props.names[team]}
                  width={432}
                  startFontSize={56}
                  startLineHeight={67}
                  boxHeight={300}
                  align="center"
                  className="text-display"
                  style={{ left: 24, top: 0 }}
                />
              ) : (
                <>
                  <TeamName
                    name={props.names[above]}
                    width={432}
                    startFontSize={40}
                    startLineHeight={48}
                    boxHeight={100}
                    align="center"
                    color="var(--color-text-secondary)"
                    className="text-display"
                    style={{ left: 24, top: 0 }}
                  />
                  <TeamName
                    name={props.names[team]}
                    width={432}
                    startFontSize={56}
                    startLineHeight={67}
                    boxHeight={100}
                    align="center"
                    className="text-display"
                    style={{ left: 24, top: 100 }}
                  />
                  <TeamName
                    name={props.names[below]}
                    width={432}
                    startFontSize={40}
                    startLineHeight={48}
                    boxHeight={100}
                    align="center"
                    color="var(--color-text-secondary)"
                    className="text-display"
                    style={{ left: 24, top: 200 }}
                  />
                </>
              )}
            </Card>
          </div>
        );
      })}
      {props.settled ? (
        <PrimaryButton label={copy.nextTurn} onClick={props.onNext} style={{ left: 760, top: 860 }} />
      ) : null}
    </>
  );
}
