import { useEffect, useState, type CSSProperties } from "react";
import { tokenDurationMs } from "../ui/cssDuration.ts";
import { copy } from "../copy.ts";
import { introGameTitle } from "../games/catalog.ts";
import { IDIOMS } from "../games/game3/idioms.ts";
import { Machine } from "../games/slot/Machine.tsx";
import type { RoundNumber } from "../state/types.ts";
import { Card } from "../ui/Card.tsx";
import { Coin } from "../ui/Coin.tsx";
import { Header } from "../ui/Header.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";
import "../games/game1/game1.css";
import "../games/game2/word.css";
import "../games/slot/slot.css";
import "./explain.css";

type Demo = RoundNumber | "slot";
type Frame = 1 | 2 | 3 | 4;
export function staticFrameFor(id: Demo): Frame {
  return id === "slot" ? 1 : id === 2 || id === 3 ? 2 : 3;
}

function useDemoFrame(id: Demo): { frame: Frame; reduced: boolean; finished: boolean; dissolving: boolean } {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [frame, setFrame] = useState<Frame>(() => reduced ? staticFrameFor(id) : 1);
  const [finished, setFinished] = useState(reduced);
  const [dissolving, setDissolving] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (reduced) { setFrame(staticFrameFor(id)); setFinished(true); return; }
    setFrame(1); setFinished(false); setDissolving(false);
    let cycle = 0;
    let step: Frame = 1;
    let timer = 0;
    const ms = (name: string, fallback: number) => tokenDurationMs(name, fallback);
    const transition = ms("--motion-demo-transition", 350);
    const delays = [1, 2, 3].map((n, i) => ms(`--motion-demo-hold-${n}`, [700, 800, 800][i]) + transition);
    delays.push(ms("--motion-demo-hold-4", 1200));
    let inDissolve = false;
    const advance = () => {
      if (step === 4 && !inDissolve) {
        inDissolve = true;
        setDissolving(true);
        timer = window.setTimeout(advance, ms("--motion-demo-dissolve", 300));
        return;
      }
      if (step === 4) {
        inDissolve = false;
        setDissolving(false);
        cycle += 1;
        if (cycle === 3) { setFrame(staticFrameFor(id)); setFinished(true); return; }
        step = 1;
      } else step = (step + 1) as Frame;
      setFrame(step);
      timer = window.setTimeout(advance, delays[step - 1]);
    };
    timer = window.setTimeout(advance, delays[0]);
    return () => window.clearTimeout(timer);
  }, [id, reduced]);
  return { frame: reduced ? staticFrameFor(id) : frame, reduced, finished, dissolving };
}

export function GameExplain({ round, onNext }: { round: Demo; onNext: () => void }) {
  const { frame, reduced, finished, dissolving } = useDemoFrame(round);
  const line = round === "slot" ? copy.explainSlot : [copy.explainMine, copy.explainCountry, copy.explainIdiom, copy.explainTimer, copy.explainHidden][round - 1];
  return <>
    <Header variant="plain" title={round === "slot" ? copy.afterFiveRounds : copy.roundOfFive(round)} />
    <div className="explain-title"><Coin size={58} style={{ position: "relative" }} /><span>{round === "slot" ? copy.destinysLever : introGameTitle(round)}</span><Coin size={58} style={{ position: "relative" }} /></div>
    <div className="explain-line">{line}</div>
    <Card x={460} y={290} w={1000} h={500} radius={36} shadow>
      <div className={`explain-window ${finished ? "is-finished" : ""} ${dissolving ? "is-dissolving" : ""}`} aria-hidden="true" style={{ "--tap-hold": `var(--motion-demo-hold-${frame})` } as CSSProperties}>
        {round === 1 ? <MineDemo frame={frame} /> : round === 2 || round === 3 ? <WordDemo id={round} frame={frame} /> : round === 4 || round === 5 ? <TimerDemo id={round} frame={frame} /> : <SlotDemo frame={frame} reduced={reduced} finished={finished} />}
        <span className="explain-demo-status" data-frame={frame} data-reduced={reduced} data-finished={finished} />
      </div>
    </Card>
    <PrimaryButton label={copy.goPlayGame} onClick={onNext} style={{ left: 660, top: 860, width: 600, height: 120, fontSize: 50, lineHeight: "60px" }} />
  </>;
}

function Tap({ className = "" }: { className?: string }) { return <span className={`demo-tap ${className}`} />; }
function MineDemo({ frame }: { frame: Frame }) {
  return <div className="demo-mine">{Array.from({ length: 25 }, (_, i) => {
    const open = (i === 7 && frame >= 2) || (i === 16 && frame === 4);
    return <div key={i} className={`mine-tile ${open ? "is-open is-n1" : "is-closed"}`} style={{ left: (i % 5) * 89, top: Math.floor(i / 5) * 89 }}><span className="demo-mine-number">1</span><Tap className={(frame === 1 && i === 7) || (frame === 3 && i === 16) ? "is-visible" : ""} /></div>;
  })}</div>;
}
function WordDemo({ id, frame }: { id: 2 | 3; frame: Frame }) {
  const cards = id === 2 ? ["랜", "뉴", "드", "질"] : ["감", "래", "고", "진"];
  const answer = id === 2 ? ["뉴", "질", "랜", "드"] : ["고", "진", "감", "래"];
  const filled = frame === 1 ? 0 : frame === 2 ? 1 : frame === 3 ? 2 : 3;
  const tapped = frame === 1 ? answer[0] : frame === 2 ? answer[1] : frame === 3 ? answer[2] : answer[3];
  return <div className={`demo-word ${id === 3 ? "is-idiom" : ""}`}>
    {id === 3 ? <div className="demo-meaning"><small>뜻풀이</small><br />{IDIOMS.find(item => item.answer === "고진감래")?.meaning}</div> : null}
    <div className="demo-word-panel">{answer.map((glyph, i) => <div key={i} className={`word-slot ${i < filled ? "is-filled" : "is-empty"}`} style={{ left: 46 + i * 166, top: 27 }}><span className="demo-slot-glyph">{glyph}</span></div>)}<div className="word-back">←</div></div>
    <div className="demo-word-cards">{cards.map((glyph, i) => <div key={glyph} className={`word-card ${answer.slice(0, filled).includes(glyph) ? "is-used" : "is-ready"}`} style={{ left: i * 174, top: 0 }}>{glyph}<span className="word-strike" /><Tap className={glyph === tapped ? "is-visible" : ""} /></div>)}</div>
  </div>;
}
function TimerDemo({ id, frame }: { id: 4 | 5; frame: Frame }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (frame !== 2) return;
    setCount(0);
    const interval = window.setInterval(() => setCount(value => Math.min(10.137, value + 0.6)), 50);
    return () => window.clearInterval(interval);
  }, [frame]);
  const hidden = id === 5 && frame !== 4;
  return <><div className={`demo-clock ${hidden ? "is-hidden" : ""}`}>{hidden ? "숫자는 가려져 있어요" : frame === 1 ? "0.000" : frame === 2 ? count.toFixed(3) : "10.137"}</div><div className={`demo-timer-button ${frame === 3 ? "is-pressed" : ""}`}><PrimaryButton label={frame === 1 ? copy.start : "멈춤"} onClick={() => {}} style={{ left: 0, top: 0, width: 396, height: 120, fontSize: 44 }} /><Tap className={frame === 1 || frame === 3 ? "is-visible" : ""} /></div></>;
}
function SlotDemo({ frame, reduced, finished }: { frame: Frame; reduced: boolean; finished: boolean }) {
  const noop = () => {};
  return <div className="demo-machine"><Machine stops={["seven", "cherry", "bell"]} mode={!reduced && !finished && (frame === 2 || frame === 3) ? "spinning" : "idle"} reducedMotion={reduced} leverPull={frame === 2 ? 168 : 0} leverLive={false} showHints hintsAnimated={false} onLeverSpin={noop} onLeverPullChange={noop} onLeverPress={noop} onFailedPull={noop} /><Tap className={`slot-tap ${frame === 1 ? "is-visible" : ""}`} /></div>;
}
