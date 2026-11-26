import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  HINT_HIDE_MS,
  HINT_RESTART_MS,
  LEVER_AXIS_Y,
  LEVER_COMMIT_MS,
  LEVER_MAX_PX,
  LEVER_RETURN_AFTER_SPIN_MS,
  LEVER_SPRING_MS,
  REEL_SPIN_PX_PER_SEC,
  REEL_STOP_EASE_MS,
  REEL_STRIP_PITCH,
  allReelsSettledAt,
  knobCenterY,
  leverPullPx,
  leverShouldSpin,
  reelStopAt,
  type ReelSymbol,
} from "./logic.ts";
import { slotCopy } from "./copy.ts";
import type { FrozenSpin } from "./fixtures.ts";

const SYMBOL_SRC: Record<ReelSymbol, string> = {
  seven: "/assets/reel-symbol-7.svg",
  cherry: "/assets/reel-symbol-cherry.svg",
  bell: "/assets/reel-symbol-bell.svg",
};

const STRIP_SYMBOLS: ReelSymbol[] = ["seven", "cherry", "bell", "seven", "cherry", "bell", "seven", "cherry", "bell"];
const LOOP = REEL_STRIP_PITCH * 3;

export function toCanvasPoint(event: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const canvas = document.querySelector(".canvas");
  if (!(canvas instanceof HTMLElement)) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1920,
    y: ((event.clientY - rect.top) / rect.height) * 1080,
  };
}

function easeOutOvershoot(progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  // Solve the curve's x coordinate before evaluating y.
  let low = 0;
  let high = 1;
  for (let i = 0; i < 20; i++) {
    const t = (low + high) / 2;
    const x = 3 * (1 - t) ** 2 * t * 0.34 + 3 * (1 - t) * t ** 2 * 0.64 + t ** 3;
    if (x < progress) low = t;
    else high = t;
  }
  const t = (low + high) / 2;
  return 3 * (1 - t) ** 2 * t * 1.56 + 3 * (1 - t) * t ** 2 + t ** 3;
}

function targetOffset(from: number, symbol: ReelSymbol): number {
  const base = (["seven", "cherry", "bell"] as const).indexOf(symbol) * REEL_STRIP_PITCH;
  let next = Math.floor(from / LOOP) * LOOP + base;
  if (next < from + 120) next += LOOP;
  return next;
}

function spinOffset(elapsed: number, index: 0 | 1 | 2, symbol: ReelSymbol, reduced: boolean): number {
  const stopAt = reelStopAt(index);
  if (reduced) return (["seven", "cherry", "bell"] as const).indexOf(symbol) * REEL_STRIP_PITCH;
  if (elapsed < stopAt) return (elapsed / 1000) * REEL_SPIN_PX_PER_SEC;
  const start = (stopAt / 1000) * REEL_SPIN_PX_PER_SEC;
  const dest = targetOffset(start, symbol);
  const progress = Math.min(1, (elapsed - stopAt) / REEL_STOP_EASE_MS);
  return start + (dest - start) * easeOutOvershoot(progress);
}

export function Machine(props: {
  stops: [ReelSymbol | "dash", ReelSymbol | "dash", ReelSymbol | "dash"];
  mode: "idle" | "spinning" | "result";
  frozenSpin?: FrozenSpin;
  win?: boolean;
  showWinEffect?: boolean;
  reducedMotion: boolean;
  leverPull: number;
  leverLive: boolean;
  showHints: boolean;
  hintsAnimated: boolean;
  onLeverSpin: () => void;
  onLeverPullChange: (pull: number) => void;
  onLeverPress: () => void;
  onFailedPull: () => void;
}) {
  return (
    <div className={props.showWinEffect && props.win ? "slot-machine is-win-pulse" : "slot-machine"}>
      <img className="slot-frame" src="/assets/slot-frame-with-bulbs.svg" alt="" />
      <Reel x={60} symbol={props.stops[0]} index={0} mode={props.mode} frozen={props.frozenSpin} win={props.win} reduced={props.reducedMotion} />
      <Reel x={440} symbol={props.stops[1]} index={1} mode={props.mode} frozen={props.frozenSpin} win={props.win} reduced={props.reducedMotion} />
      <Reel x={820} symbol={props.stops[2]} index={2} mode={props.mode} frozen={props.frozenSpin} win={props.win} reduced={props.reducedMotion} />
      <Lever
        pull={props.leverPull}
        live={props.leverLive}
        reduced={props.reducedMotion}
        onPullChange={props.onLeverPullChange}
        onSpin={props.onLeverSpin}
        onPress={props.onLeverPress}
        onFailedPull={props.onFailedPull}
      />
      {props.showHints ? (
        <Hints animated={props.hintsAnimated && !props.reducedMotion} instantHide={props.reducedMotion} />
      ) : null}
    </div>
  );
}

function Reel(props: {
  x: number;
  symbol: ReelSymbol | "dash";
  index: 0 | 1 | 2;
  mode: "idle" | "spinning" | "result";
  frozen?: FrozenSpin;
  win?: boolean;
  reduced: boolean;
}) {
  const showStack =
    props.frozen === "all" || (props.frozen === "left" && props.index > 0) || (props.mode === "spinning" && props.reduced);
  const stopped = props.mode !== "spinning" || (props.frozen === "left" && props.index === 0);
  const liveSpin = props.mode === "spinning" && !props.frozen && !props.reduced;

  return (
    <div className={props.win ? "slot-reel is-win" : "slot-reel"} style={{ left: props.x }}>
      <div className="slot-reel-window">
        {props.symbol === "dash" && stopped ? <div className="slot-dash">{slotCopy.dash}</div> : null}
        {stopped && props.symbol !== "dash" && !showStack ? (
          <img
            className={`slot-sym ${props.symbol === "seven" ? "slot-sym-7 is-full" : `slot-sym-${props.symbol} is-full`}`}
            src={SYMBOL_SRC[props.symbol]}
            alt=""
          />
        ) : null}
        {showStack && props.symbol !== "dash" ? <StackedSymbols /> : null}
        {liveSpin && props.symbol !== "dash" ? <SpinningStrip index={props.index} target={props.symbol} /> : null}
      </div>
    </div>
  );
}

function StackedSymbols() {
  return (
    <div className="slot-stack">
      <img className="slot-sym slot-sym-7" src={SYMBOL_SRC.seven} alt="" />
      <img className="slot-sym slot-sym-cherry" src={SYMBOL_SRC.cherry} alt="" />
      <img className="slot-sym slot-sym-bell" src={SYMBOL_SRC.bell} alt="" />
    </div>
  );
}

function SpinningStrip(props: { index: 0 | 1 | 2; target: ReelSymbol }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const node = ref.current;
      if (!node) return;
      const offset = spinOffset(now - start, props.index, props.target, false);
      node.style.transform = `translateY(${offset}px)`;
      if (now - start < allReelsSettledAt()) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [props.index, props.target]);

  const cells = STRIP_SYMBOLS.map((symbol, i) => (
    <div className="slot-strip-cell" key={`${symbol}-${i}`}>
      <img className={`slot-sym-${symbol}`} src={SYMBOL_SRC[symbol]} alt="" />
    </div>
  ));

  return (
    <div ref={ref} className="slot-strip" style={{ top: -LOOP + 90 }}>
      {cells}
      {cells}
    </div>
  );
}

function Lever(props: {
  pull: number;
  live: boolean;
  reduced: boolean;
  onPullChange: (pull: number) => void;
  onSpin: () => void;
  onPress: () => void;
  onFailedPull: () => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullRef = useRef(props.pull);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    pullRef.current = props.pull;
  }, [props.pull]);

  const onDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!props.live || event.button !== 0) return;
      const point = toCanvasPoint(event);
      if (!point) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      startY.current = point.y - pullRef.current;
      setDragging(true);
      props.onPress();
    },
    [props.live],
  );

  const onMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      const point = toCanvasPoint(event);
      if (!point) return;
      props.onPullChange(leverPullPx(startY.current, point.y));
    },
    [dragging, props],
  );

  const finish = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const pull = pullRef.current;
      if (leverShouldSpin(pull)) {
        const start = pull;
        const startedAt = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - startedAt) / LEVER_COMMIT_MS);
          const eased = t * t;
          props.onPullChange(start + (LEVER_MAX_PX - start) * eased);
          if (t < 1) requestAnimationFrame(tick);
          else props.onSpin();
        };
        requestAnimationFrame(tick);
      } else {
        const start = pull;
        const startedAt = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - startedAt) / LEVER_SPRING_MS);
          const eased = 1 - Math.pow(1 - t, 3);
          const spring = Math.sin(t * Math.PI) * 8 * (1 - t);
          props.onPullChange(Math.max(0, start * (1 - eased) - spring));
          if (t < 1) requestAnimationFrame(tick);
          else {
            props.onPullChange(0);
            props.onFailedPull();
          }
        };
        requestAnimationFrame(tick);
      }
    },
    [dragging, props],
  );

  const knobCenter = knobCenterY(props.pull) - 252;
  const knobY = knobCenter - 48;
  const axisLocal = LEVER_AXIS_Y - 252;
  const rodTop = Math.min(axisLocal, knobCenter);
  const rodHeight = Math.max(8, Math.abs(axisLocal - knobCenter));

  const className = ["slot-lever", props.live ? "is-live" : "", dragging ? "is-dragging" : ""].filter(Boolean).join(" ");

  return (
    <div
      ref={areaRef}
      className={className}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      <span className="slot-lever-base" />
      <span className="slot-lever-rod" style={{ top: rodTop, height: rodHeight }} />
      <span className="slot-lever-axis" />
      <span className="slot-lever-knob" style={{ top: knobY }}>
        <span className="slot-lever-knob-body" />
        <span className="slot-lever-knob-shine" />
      </span>
    </div>
  );
}

function Hints(props: { animated: boolean; instantHide: boolean }) {
  const className = ["slot-hints", props.animated ? "is-animated" : ""].filter(Boolean).join(" ");
  return (
    <div className={className} aria-hidden="true">
      <Chevron />
      <Chevron />
      <Chevron />
    </div>
  );
}

function Chevron() {
  return (
    <svg className="slot-hint" viewBox="0 0 56 24" fill="none">
      <path d="M4 5 L28 19 L52 5" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function useLeverReturn(active: boolean, onPullChange: (pull: number) => void) {
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startedAt) / 400);
        const eased = 1 - Math.pow(1 - t, 3);
        onPullChange(LEVER_MAX_PX * (1 - eased));
        if (t < 1) requestAnimationFrame(tick);
        else onPullChange(0);
      };
      requestAnimationFrame(tick);
    }, LEVER_RETURN_AFTER_SPIN_MS);
    return () => window.clearTimeout(timer);
  }, [active, onPullChange]);
}

export { HINT_HIDE_MS, HINT_RESTART_MS };
