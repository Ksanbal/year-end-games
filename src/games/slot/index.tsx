import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { copy } from "../../copy.ts";
import { minusSign } from "../../format.ts";
import { Header } from "../../ui/Header.tsx";
import { FlatButton } from "../../ui/FlatButton.tsx";
import { PrimaryButton } from "../../ui/PrimaryButton.tsx";
import { TeamName } from "../../screens/TeamName.tsx";
import { Coin } from "../../ui/Coin.tsx";
import type { SlotModule } from "../types.ts";
import { AllInButton } from "./AllInButton.tsx";
import { Machine, useLeverReturn } from "./Machine.tsx";
import { slotCopy } from "./copy.ts";
import { e2eEnabled, readSlotFixture, type SlotFixture } from "./fixtures.ts";
import {
  BET_STEP_LARGE,
  BET_STEP_SMALL,
  HINT_HIDE_MS,
  HINT_RESTART_MS,
  LEVER_MAX_PX,
  allReelsSettledAt,
  clampBet,
  coinsAfter,
  displayCoins,
  isAllIn,
  nudgeBet,
  openingView,
  outcomeForStops,
  rollStops,
  showEmptyCoin,
  topicParticle,
  type ReelStops,
  type ReelSymbol,
  type SlotView,
} from "./logic.ts";
import "./slot.css";

const IDLE_STOPS: [ReelSymbol, ReelSymbol, ReelSymbol] = ["seven", "cherry", "bell"];


function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function burstRequested(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("burst");
}

function initialView(coins: number, fixture: SlotFixture | null): SlotView {
  if (fixture) return fixture.view;
  return openingView(coins);
}

export const slotGame: SlotModule = {
  id: "slot",
  Play({ context, onFinish }) {
    return <SlotPlay context={context} onFinish={onFinish} />;
  },
  Done({ onRevealFinal }) {
    return <SlotDone onRevealFinal={onRevealFinal} />;
  },
};

function SlotDone(props: { onRevealFinal: () => void }) {
  useLayoutEffect(() => {
    props.onRevealFinal();
  }, [props]);
  return null;
}

function SlotPlay(props: {
  context: { names: [string, string, string]; coins: [number, number, number]; team: 0 | 1 | 2; orderIndex: 0 | 1 | 2 };
  onFinish: (outcome: { kind: "skip" } | { kind: "lose"; bet: number } | { kind: "win"; bet: number }) => void;
}) {
  const fixture = useMemo(() => readSlotFixture(), []);
  const coins = props.context.coins[props.context.team];
  const lastTeam = props.context.orderIndex === 2;
  const [view, setView] = useState<SlotView>(() => initialView(coins, fixture));
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [leverPull, setLeverPull] = useState(() => (fixture?.leverDown ? LEVER_MAX_PX : 0));
  const [leverPressed, setLeverPressed] = useState(false);
  const [hintsHidden, setHintsHidden] = useState(false);
  const [hintsArmed, setHintsArmed] = useState(true);
  const [winEffect, setWinEffect] = useState(false);
  const nextStops = useRef<ReelStops | null>(null);
  const hideTimer = useRef(0);
  const restartTimer = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setView(initialView(props.context.coins[props.context.team], fixture));
    if (!fixture?.leverDown) setLeverPull(0);
    setHintsArmed(true);
    setHintsHidden(false);
    const showBurst = burstRequested() && fixture?.view.kind === "result" && fixture.view.outcome.kind === "win";
    setWinEffect(showBurst);
  }, [props.context.team, props.context.orderIndex, fixture]);

  const spinning = view.kind === "spinning" && !fixture?.frozenSpin;
  useLeverReturn(spinning, setLeverPull);

  useEffect(() => {
    if (view.kind !== "spinning" || fixture?.frozenSpin) return;
    const wait = reducedMotion ? 0 : allReelsSettledAt();
    const timer = window.setTimeout(() => {
      const outcome = outcomeForStops(view.bet, view.stops);
      setView({ kind: "result", outcome, stops: view.stops });
      if (outcome.kind === "win" && !reducedMotion) setWinEffect(true);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [view, fixture, reducedMotion]);

  useEffect(() => {
    if (!e2eEnabled()) return;
    const api = {
      getView: () => view.kind,
      getPull: () => leverPull,
      setNextStops: (stops: ReelStops) => {
        nextStops.current = stops;
      },
    };
    (window as Window & { __slot?: typeof api }).__slot = api;
    return () => {
      delete (window as Window & { __slot?: typeof api }).__slot;
    };
  }, [view, leverPull]);

  const startSpin = useCallback(
    (bet: number) => {
      const stops = nextStops.current ?? rollStops();
      nextStops.current = null;
      setView({ kind: "spinning", bet, stops });
      setHintsHidden(true);
    },
    [],
  );

  const onFailedPull = useCallback(() => {
    setLeverPressed(false);
    window.clearTimeout(restartTimer.current);
    restartTimer.current = window.setTimeout(() => {
      setHintsHidden(false);
      setHintsArmed(true);
    }, HINT_RESTART_MS);
  }, []);

  const onLeverSpin = useCallback(() => {
    setLeverPressed(false);
    if (view.kind === "ready") startSpin(view.bet);
  }, [startSpin, view]);

  const placeBet = (bet: number) => {
    const next = clampBet(bet, coins);
    if (next < 1) return;
    if (isAllIn(next, coins) && view.kind === "betting") {
      setView({ kind: "betting", bet: next, confirmAllIn: true });
      return;
    }
    setView({ kind: "ready", bet: next });
  };

  const shownCoins = displayCoins(coins, view);
  const idleStops: [ReelSymbol | "dash", ReelSymbol | "dash", ReelSymbol | "dash"] =
    view.kind === "spinning" || view.kind === "result" ? view.stops : IDLE_STOPS;
  const readyForLever = view.kind === "ready" && !fixture?.frozenSpin;
  const showHints =
    view.kind === "ready" &&
    !hintsHidden &&
    hintsArmed &&
    !leverPressed &&
    leverPull === 0 &&
    !fixture?.frozenSpin;
  const freezeMotion = Boolean(fixture) || view.kind === "betting" && view.confirmAllIn;

  return (
    <>
      <Header title={copy.destinysLever} meta={slotCopy.teamTurn((props.context.orderIndex + 1) as 1 | 2 | 3)} />
      <TeamName
        name={props.context.names[props.context.team]}
        width={256}
        startFontSize={48}
        startLineHeight={58}
        boxHeight={58}
        className="text-display"
        style={{ left: 80, top: 150, zIndex: 2 }}
      />
      <div className="slot-owned">
        <Coin
          size={52}
          empty={showEmptyCoin(shownCoins)}
          className="slot-owned-coin"
          style={{ position: "relative", left: "auto", top: "auto" }}
        />
        <span className="slot-owned-label">{slotCopy.ownedCoins(shownCoins)}</span>
      </div>
      <Machine
        stops={idleStops}
        mode={view.kind === "spinning" ? "spinning" : view.kind === "result" ? "result" : "idle"}
        frozenSpin={fixture?.frozenSpin}
        win={view.kind === "result" && view.outcome.kind === "win"}
        showWinEffect={winEffect}
        reducedMotion={reducedMotion}
        leverPull={view.kind === "betting" ? 0 : leverPull}
        leverLive={readyForLever}
        showHints={showHints}
        hintsAnimated={showHints}
        onLeverSpin={onLeverSpin}
        onLeverPullChange={setLeverPull}
        onLeverPress={() => {
          setLeverPressed(true);
          window.clearTimeout(hideTimer.current);
          if (reducedMotion) setHintsHidden(true);
          else hideTimer.current = window.setTimeout(() => setHintsHidden(true), HINT_HIDE_MS);
        }}
        onFailedPull={onFailedPull}
      />
      {view.kind === "betting" ? (
        <Betting
          bet={view.bet}
          coins={coins}
          confirm={view.confirmAllIn}
          staticMotion={freezeMotion}
          reducedMotion={reducedMotion}
          onNudge={(delta) => setView({ kind: "betting", bet: nudgeBet(view.bet, delta, coins), confirmAllIn: false })}
          onAllIn={() => setView({ kind: "betting", bet: view.bet, confirmAllIn: true })}
          onConfirm={() => setView({ kind: "ready", bet: coins })}
          onCancel={() => setView({ kind: "betting", bet: view.bet, confirmAllIn: false })}
          onPlace={() => placeBet(view.bet)}
          onSkip={() =>
            setView({
              kind: "result",
              outcome: { kind: "skip" },
              stops: ["dash", "dash", "dash"],
            })
          }
        />
      ) : null}
      {view.kind === "ready" ? (
        <>
          <div className="slot-placed is-ready">{slotCopy.betPlaced(view.bet)}</div>
          {!fixture?.frozenSpin ? (
            <FlatButton
              label={slotCopy.changeBet}
              width={300}
              height={112}
              fontSize={45}
              onClick={() => {
                setLeverPull(0);
                setView({ kind: "betting", bet: view.bet, confirmAllIn: false });
              }}
              style={{ left: 80, top: 930 }}
            />
          ) : null}
        </>
      ) : null}
      {view.kind === "spinning" ? <div className="slot-placed is-spin">{slotCopy.betPlaced(view.bet)}</div> : null}
      {view.kind === "result" ? (
        <Result
          name={props.context.names[props.context.team]}
          startCoins={coins}
          view={view}
          lastTeam={lastTeam}
          showBurst={winEffect && !reducedMotion}
          onContinue={() => props.onFinish(view.outcome)}
        />
      ) : null}
    </>
  );
}

function Betting(props: {
  bet: number;
  coins: number;
  confirm: boolean;
  staticMotion: boolean;
  reducedMotion: boolean;
  onNudge: (delta: number) => void;
  onAllIn: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onPlace: () => void;
  onSkip: () => void;
}) {
  const canBet = props.coins >= 1 && props.bet >= 1;
  return (
    <>
      <div className="slot-bet-label">{slotCopy.betLabel}</div>
      <StepButton label={slotCopy.minus10} left={360} onClick={() => props.onNudge(-BET_STEP_LARGE)} />
      <StepButton label={slotCopy.minus1} left={520} onClick={() => props.onNudge(-BET_STEP_SMALL)} />
      <div className="slot-bet-value">{slotCopy.betAmount(props.bet)}</div>
      <StepButton label={slotCopy.plus1} left={960} onClick={() => props.onNudge(BET_STEP_SMALL)} />
      <StepButton label={slotCopy.plus10} left={1120} onClick={() => props.onNudge(BET_STEP_LARGE)} />
      <AllInButton disabled={props.coins < 1} staticMotion={props.staticMotion} reducedMotion={props.reducedMotion} onClick={props.onAllIn} />
      <FlatButton label={slotCopy.skip} width={300} height={112} fontSize={45} onClick={props.onSkip} style={{ left: 80, top: 930 }} />
      <PrimaryButton
        label={slotCopy.placeBet}
        size="md"
        disabled={!canBet}
        onClick={props.onPlace}
        style={{ left: 1500, top: 930, width: 340 }}
      />
      {props.confirm ? (
        <div className="dim">
          <div
            className="card-shadow"
            style={{ left: 560, top: 270, width: 800, height: 540, borderRadius: 40, background: "var(--color-shadow-on-dim)" }}
          />
          <div className="card-face" style={{ left: 560, top: 260, width: 800, height: 540, borderRadius: 40, zIndex: 6 }} />
          <div
            className="text-display text-center"
            style={{ position: "absolute", left: 560, top: 310, width: 800, height: 58, fontSize: 48, lineHeight: "58px", zIndex: 7 }}
          >
            {slotCopy.confirmAllInTitle}
          </div>
          <div
            className="text-ui text-center"
            style={{
              position: "absolute",
              left: 620,
              top: 413,
              width: 680,
              height: 36,
              fontSize: 30,
              fontWeight: 500,
              lineHeight: "36px",
              color: "var(--color-text-secondary)",
              zIndex: 7,
            }}
          >
            {slotCopy.confirmAllInBody(props.coins)}
          </div>
          <FlatButton label={slotCopy.cancel} width={340} height={112} fontSize={45} onClick={props.onCancel} style={{ left: 600, top: 600, zIndex: 7 }} />
          <FlatButton label={slotCopy.allIn} width={340} height={112} fontSize={45} onClick={props.onConfirm} style={{ left: 980, top: 600, zIndex: 7 }} />
        </div>
      ) : null}
    </>
  );
}

function StepButton(props: { label: string; left: number; onClick: () => void }) {
  return (
    <FlatButton
      label={props.label}
      width={140}
      height={112}
      fontSize={45}
      onClick={props.onClick}
      style={{ left: props.left, top: 724 }}
    />
  );
}

function Result(props: {
  name: string;
  startCoins: number;
  view: Extract<SlotView, { kind: "result" }>;
  lastTeam: boolean;
  showBurst: boolean;
  onContinue: () => void;
}) {
  const outcome = props.view.outcome;
  const after = coinsAfter(props.startCoins, outcome);
  const button = props.lastTeam ? slotCopy.revealFinal : slotCopy.nextTeam;
  const width = props.lastTeam ? 500 : 400;
  const left = props.lastTeam ? 710 : 760;
  return (
    <>
      {outcome.kind === "win" ? (
        <div className="slot-headline is-win">{slotCopy.jackpot(outcome.bet * 10)}</div>
      ) : null}
      {outcome.kind === "lose" ? <div className="slot-headline">{slotCopy.lost(outcome.bet)}</div> : null}
      {outcome.kind === "skip" ? (
        <div className="slot-headline">{slotCopy.skipped(props.name, topicParticle(props.name))}</div>
      ) : null}
      {outcome.kind === "win" ? (
        <div className="slot-sub">
          {minusSign(slotCopy.coinsChanged(props.startCoins, after)).map((part, i) => (
            <span key={i} className={part.font === "ui" ? "text-ui" : "text-display"}>
              {part.text}
            </span>
          ))}
        </div>
      ) : null}
      {outcome.kind === "lose" ? (
        <div className="slot-sub is-muted">
          {minusSign(slotCopy.coinsChanged(props.startCoins, after)).map((part, i) => (
            <span key={i} className={part.font === "ui" ? "text-ui" : "text-display"}>
              {part.text}
            </span>
          ))}
        </div>
      ) : null}
      {outcome.kind === "skip" ? <div className="slot-sub is-muted">{slotCopy.coinsUnchanged(after)}</div> : null}
      {props.showBurst ? <CoinBurst /> : null}
      <PrimaryButton
        label={button}
        size={props.lastTeam ? "wideMd" : "md"}
        onClick={props.onContinue}
        style={{ left, top: 900, width }}
      />
    </>
  );
}

function CoinBurst() {
  const coins = [
    [-220, -180],
    [40, -240],
    [260, -160],
    [-300, 20],
    [320, 40],
    [-80, -280],
    [160, -260],
    [-180, 120],
    [240, 130],
    [-40, -200],
    [80, 180],
    [-260, -80],
  ];
  return (
    <div className="slot-burst" aria-hidden="true">
      {coins.map(([dx, dy], i) => (
        <Coin
          key={i}
          size={52}
          className="slot-burst-coin"
          style={{ ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px`, animationDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}
