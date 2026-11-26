import { useState } from "react";
import { slotCopy } from "./copy.ts";

export function AllInButton(props: {
  disabled?: boolean;
  staticMotion: boolean;
  reducedMotion: boolean;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const className = [
    "slot-allin",
    props.staticMotion || props.reducedMotion ? "is-static" : "",
    props.reducedMotion ? "is-reduce" : "",
    pressed ? "is-pressed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="slot-allin-wrap">
      <button
        type="button"
        className={className}
        disabled={props.disabled}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onClick={props.onClick}
      >
        <span className="slot-allin-glow" />
        <span className="slot-allin-depth" />
        <span className="slot-allin-body">
          <span className="slot-allin-gloss" />
          <span className="slot-allin-shine" />
        </span>
        <span className="slot-allin-label">{slotCopy.allIn}</span>
        <img
          className="slot-allin-coin is-left"
          alt=""
          src="/coins/coin-gold-small-36@2x.png"
          srcSet="/coins/coin-gold-small-36@2x.png 2x, /coins/coin-gold-small-36@3x.png 3x"
          width={36}
          height={40.32}
          draggable={false}
        />
        <img
          className="slot-allin-coin is-right"
          alt=""
          src="/coins/coin-gold-small-36@2x.png"
          srcSet="/coins/coin-gold-small-36@2x.png 2x, /coins/coin-gold-small-36@3x.png 3x"
          width={36}
          height={40.32}
          draggable={false}
        />
        <img className="slot-allin-star is-1" src="/assets/allin-sparkle.svg" alt="" />
        <img className="slot-allin-star is-2" src="/assets/allin-sparkle.svg" alt="" />
        <img className="slot-allin-star is-3" src="/assets/allin-sparkle.svg" alt="" />
        <img className="slot-allin-star is-4" src="/assets/allin-sparkle.svg" alt="" />
      </button>
    </div>
  );
}
