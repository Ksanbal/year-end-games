import { useEffect, useRef, useState } from "react";
import { headerGameTitle } from "../catalog.ts";
import type { GameContext } from "../types.ts";
import type { TurnResult } from "../../state/types.ts";
import { Card } from "../../ui/Card.tsx";
import { FlatButton } from "../../ui/FlatButton.tsx";
import { Header } from "../../ui/Header.tsx";
import { ResultOverlay } from "../game1/ResultOverlay.tsx";
import { answerLayout, CARD_GAP, SLOT_GAP } from "./layout.ts";
import {
  MAX_QUESTIONS,
  TIME_LIMIT_MS,
  dealCards,
  isCorrect,
  pickProblem,
  readUsedAnswers,
  recordUsedAnswers,
  remainLabel,
  type WordProblem,
} from "./wordLogic.ts";
import "./word.css";

const gameCopy = {
  skip: "스킵",
  back: "←",
  wrong: "틀렸어요. 카드가 처음 자리로 돌아가요",
  done: "게임이 끝났어요",
  hitLabel: "맞힌 문제",
  meaningLabel: "뜻풀이",
} as const;

export type WordFixture = {
  problem: WordProblem;
  cards: string[];
  slots: (string | null)[];
  score: number;
  remainMs: number;
  phase: "playing" | "wrong" | "complete" | "timeup";
};

export function WordPlay(props: {
  gameId: 2 | 3;
  context: GameContext;
  onFinish: (result: TurnResult) => void;
  problems: readonly WordProblem[];
  fixture?: WordFixture | null;
  persistUsed: boolean;
}) {
  const offsetY = props.gameId === 3 ? 70 : 0;
  const [session] = useState(() => startTurn(props));
  const [score, setScore] = useState(session.score);
  const [asked, setAsked] = useState(session.asked);
  const [seen, setSeen] = useState<string[]>(session.seen);
  const [problem, setProblem] = useState<WordProblem>(session.problem);
  const [cards, setCards] = useState<string[]>(session.cards);
  const [slots, setSlots] = useState<(number | null)[]>(session.slots);
  const [phase, setPhase] = useState<WordFixture["phase"]>(session.phase);
  const [remainMs, setRemainMs] = useState(session.remainMs);
  const startedAt = useRef<number | null>(null);
  const frozen = Boolean(props.fixture);

  useEffect(() => {
    if (frozen || phase === "complete" || phase === "timeup") return;
    if (startedAt.current === null) {
      startedAt.current = performance.now() - (TIME_LIMIT_MS - session.remainMs);
    }
    let frame = 0;
    const tick = () => {
      const origin = startedAt.current ?? performance.now();
      const left = Math.max(0, TIME_LIMIT_MS - (performance.now() - origin));
      setRemainMs(left);
      if (left <= 0) {
        setPhase("timeup");
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [frozen, phase]);

  useEffect(() => {
    if (frozen || phase !== "wrong") return;
    const wait = window.setTimeout(() => {
      setSlots(cards.map(() => null));
      setPhase("playing");
    }, 500);
    return () => window.clearTimeout(wait);
  }, [frozen, phase, cards]);

  const layout = answerLayout(cards.length, offsetY);
  const locked = phase !== "playing";

  function place(cardIndex: number) {
    if (locked) return;
    if (slots.includes(cardIndex)) return;
    const empty = slots.findIndex((slot) => slot === null);
    if (empty < 0) return;
    const next = slots.slice();
    next[empty] = cardIndex;
    setSlots(next);
    if (next.every((slot) => slot !== null)) {
      const glyphs = next.map((index) => cards[index!]!);
      if (isCorrect(glyphs, problem.answer)) {
        resolve("correct");
      } else {
        setPhase("wrong");
      }
    }
  }

  function backspace() {
    if (locked) return;
    const last = findLastFilled(slots);
    if (last < 0) return;
    const next = slots.slice();
    next[last] = null;
    setSlots(next);
  }

  function skip() {
    if (locked) return;
    resolve("skip");
  }

  function resolve(kind: "correct" | "skip") {
    const nextScore = kind === "correct" ? score + 1 : score;
    const nextAsked = asked + 1;
    const nextSeen = seen;
    setScore(nextScore);
    setAsked(nextAsked);
    if (nextAsked >= MAX_QUESTIONS) {
      setPhase("complete");
      return;
    }
    const nextProblem = pickProblem(props.problems, new Set(nextSeen));
    if (!nextProblem) {
      setPhase("complete");
      return;
    }
    const dealt = dealCards(nextProblem.answer);
    setProblem(nextProblem);
    setCards(dealt);
    setSlots(dealt.map(() => null));
    setSeen([...nextSeen, nextProblem.answer]);
    setPhase("playing");
  }

  function finish() {
    if (props.persistUsed) recordUsedAnswers(props.gameId, seen);
    props.onFinish({ kind: "score", score });
  }

  return (
    <>
      <Header title={headerGameTitle(props.gameId)} variant="plain" />
      <div className="word-remain">{remainLabel(remainMs)}</div>
      {problem.meaning ? (
        <>
          <div className="word-meaning-label">{gameCopy.meaningLabel}</div>
          <div className="word-meaning">{problem.meaning}</div>
        </>
      ) : null}
      <Card
        x={layout.panelX}
        y={layout.panelY}
        w={layout.panelW}
        h={layout.panelH}
        radius={40}
        shadow
        fill="var(--color-surface-answer)"
      />
      <div className={phase === "wrong" ? "word-slots is-shake" : "word-slots"}>
        {cards.map((_, i) => {
          const cardIndex = slots[i];
          const glyph = cardIndex === null || cardIndex === undefined ? null : cards[cardIndex];
          return (
            <div
              key={`slot-${i}`}
              className={glyph ? "word-slot is-filled" : "word-slot is-empty"}
              style={{ left: layout.slotX + i * (180 + SLOT_GAP), top: layout.slotY }}
            >
              {glyph}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="word-back"
        style={{ left: layout.backX, top: layout.backY }}
        onClick={backspace}
        disabled={locked || !slots.some((slot) => slot !== null)}
        aria-label={gameCopy.back}
      >
        {gameCopy.back}
      </button>
      {cards.map((glyph, i) => {
        const used = slots.includes(i);
        return (
          <button
            key={`card-${i}`}
            type="button"
            className={used ? "word-card is-used" : "word-card is-ready"}
            style={{ left: layout.cardX + i * (180 + CARD_GAP), top: layout.cardY }}
            onClick={() => place(i)}
            disabled={locked || used}
          >
            {glyph}
            {used ? <span className="word-strike" /> : null}
          </button>
        );
      })}
      {phase === "wrong" ? (
        <div className="word-wrong" style={{ top: layout.wrongY }}>
          {gameCopy.wrong}
        </div>
      ) : null}
      {phase === "complete" || phase === "timeup" ? null : (
        <FlatButton
          label={gameCopy.skip}
          width={300}
          height={112}
          fontSize={45}
          onClick={skip}
          style={{ left: 810, top: 900, pointerEvents: locked ? "none" : "auto" }}
        />
      )}
      {phase === "complete" || phase === "timeup" ? (
        <ResultOverlay variant="word" title={gameCopy.done} label={gameCopy.hitLabel} value={String(score)} onReveal={finish} />
      ) : null}
    </>
  );
}

function findLastFilled(slots: readonly (number | null)[]): number {
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i] !== null) return i;
  }
  return -1;
}

function startTurn(props: {
  gameId: 2 | 3;
  problems: readonly WordProblem[];
  fixture?: WordFixture | null;
  persistUsed: boolean;
}): {
  score: number;
  asked: number;
  seen: string[];
  problem: WordProblem;
  cards: string[];
  slots: (number | null)[];
  phase: WordFixture["phase"];
  remainMs: number;
} {
  if (props.fixture) {
    return {
      score: props.fixture.score,
      asked: 0,
      seen: [props.fixture.problem.answer],
      problem: props.fixture.problem,
      cards: props.fixture.cards,
      slots: assignSlots(props.fixture.cards, props.fixture.slots),
      phase: props.fixture.phase,
      remainMs: props.fixture.remainMs,
    };
  }
  const prior = props.persistUsed ? readUsedAnswers(props.gameId) : [];
  const problem = pickProblem(props.problems, new Set(prior)) ?? props.problems[0]!;
  const cards = dealCards(problem.answer);
  return {
    score: 0,
    asked: 0,
    seen: [...prior, problem.answer],
    problem,
    cards,
    slots: cards.map(() => null),
    phase: "playing",
    remainMs: TIME_LIMIT_MS,
  };
}

function assignSlots(cards: string[], glyphs: readonly (string | null)[]): (number | null)[] {
  const taken = new Set<number>();
  return glyphs.map((glyph) => {
    if (glyph === null) return null;
    const index = cards.findIndex((card, i) => card === glyph && !taken.has(i));
    if (index < 0) return null;
    taken.add(index);
    return index;
  });
}
