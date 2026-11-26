import type { CSSProperties } from "react";
import { TEAM_NAME_WRAP_LINE_HEIGHT, teamNameAlignItems, useTeamNameFit, type TeamNameVAlign } from "./teamName.ts";

export function TeamName(props: {
  name: string;
  width: number;
  startFontSize: number;
  startLineHeight?: number;
  boxHeight: number;
  align?: "left" | "center" | "right";
  alignY?: TeamNameVAlign;
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const fit = useTeamNameFit(props.name, props.width, props.startFontSize);
  const wrapped = fit.lines.length > 1;
  const lineHeight = wrapped ? TEAM_NAME_WRAP_LINE_HEIGHT : (props.startLineHeight ?? props.startFontSize);
  const align = props.align ?? "left";
  const className = ["team-name", fit.ready ? "" : "is-pending", props.className ?? ""].filter(Boolean).join(" ");
  const alignY = props.alignY ?? "center";

  return (
    <div
      className={className}
      data-team-name-ready={fit.ready ? "true" : "false"}
      data-font-size={String(fit.fontSize)}
      data-lines={String(fit.lines.length)}
      data-align-y={alignY}
      style={{
        width: props.width,
        height: props.boxHeight,
        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        textAlign: align,
        color: props.color,
        ...props.style,
        alignItems: teamNameAlignItems(alignY, fit.lines.length),
      }}
    >
      <div
        className="team-name-lines"
        style={{
          fontSize: fit.fontSize,
          lineHeight: `${lineHeight}px`,
          textAlign: align,
        }}
      >
        {fit.lines.map((line, i) => (
          <div key={i} className="team-name-line">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
