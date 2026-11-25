import type { ReactNode } from "react";
import { copy } from "../../copy.ts";
import { minusSign } from "../../format.ts";
import { Card } from "../../ui/Card.tsx";
import { PrimaryButton } from "../../ui/PrimaryButton.tsx";
import "./resultOverlay.css";

export function MixedTitle({ text }: { text: string }) {
  return (
    <>
      {minusSign(text).map((part, i) => (
        <span key={`${i}-${part.text}`} className={part.font === "ui" ? "glyph" : undefined}>
          {part.text}
        </span>
      ))}
    </>
  );
}

export function ResultOverlay(props: {
  title: ReactNode;
  label?: string;
  value: string;
  caption?: string;
  variant: "mine" | "word" | "time";
  onReveal: () => void;
}) {
  const wide = props.variant === "word";
  const cardX = wide ? 460 : 560;
  const cardY = wide ? 260 : 280;
  const cardW = wide ? 1000 : 800;
  const cardH = wide ? 460 : 420;
  const titleTop = wide ? 70 : 40;
  const labelTop = wide ? 190 : 150;
  const valueTop = props.variant === "time" ? 130 : wide ? 240 : 200;
  const buttonTop = wide ? 800 : 780;

  return (
    <div className="game-overlay">
      <div className="game-overlay-dim" />
      <Card x={cardX} y={cardY} w={cardW} h={cardH} radius={40} shadow shadowFill="var(--color-shadow-on-dim)">
        <div className="text-display text-center game-result-title" style={{ top: titleTop, width: cardW }}>
          {props.title}
        </div>
        {props.label ? (
          <div className="text-ui text-center game-result-label" style={{ top: labelTop, width: cardW }}>
            {props.label}
          </div>
        ) : null}
        <div className="text-display text-center game-result-value" style={{ top: valueTop, width: cardW }}>
          {props.value}
        </div>
        {props.caption ? (
          <div className="text-ui text-center game-result-caption" style={{ top: 305, width: cardW }}>
            {props.caption}
          </div>
        ) : null}
      </Card>
      <PrimaryButton label={copy.revealResults} size="md" onClick={props.onReveal} style={{ left: 760, top: buttonTop }} />
    </div>
  );
}
