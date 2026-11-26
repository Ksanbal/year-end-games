import { copy } from "../copy.ts";
import type { TeamIndex } from "../state/types.ts";
import { Card } from "../ui/Card.tsx";
import { Coin } from "../ui/Coin.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";
import { TeamName } from "./TeamName.tsx";
import { columnWidth } from "./teamName.ts";

export function SlotIntro(props: {
  names: [string, string, string];
  coins: [number, number, number];
  order: [TeamIndex, TeamIndex, TeamIndex];
  onStart: () => void;
}) {
  return (
    <>
      <Coin size={86} left={640} top={111} />
      <Coin size={86} left={1195} top={111} />
      <div
        className="text-display text-center"
        style={{ position: "absolute", left: 0, top: 90, width: 1920, height: 115, fontSize: 96, lineHeight: "115px" }}
      >
        {copy.destinysLever}
      </div>
      <div
        className="text-ui text-center"
        style={{
          position: "absolute",
          left: 0,
          top: 220,
          width: 1920,
          height: 43,
          fontSize: 36,
          fontWeight: 500,
          lineHeight: "43px",
          color: "var(--color-text-secondary)",
        }}
      >
        {copy.slotIntroRule}
      </div>
      {props.order.map((team, i) => {
        const y = 310 + i * 130;
        const highlight = i === 0;
        return (
          <Card
            key={team}
            x={460}
            y={y}
            w={1000}
            h={110}
            radius={highlight ? 24 : 36}
            highlight={highlight}
            shadow
          >
            <div className="text-display" style={{ position: "absolute", left: 50, top: 28, fontSize: 40, lineHeight: "48px" }}>
              {copy.slotOrderLabel(i as 0 | 1 | 2)}
            </div>
            <TeamName
              name={props.names[team]}
              width={columnWidth(240, 640)}
              startFontSize={44}
              startLineHeight={53}
              boxHeight={110}
              className="text-display"
              style={{ left: 240, top: 0 }}
            />
            <div
              className="text-display"
              style={{ position: "absolute", left: 640, top: 28, width: 300, textAlign: "right", fontSize: 40, lineHeight: "48px" }}
            >
              {copy.coinsCount(props.coins[team])}
            </div>
          </Card>
        );
      })}
      <PrimaryButton label={copy.firstTeamStart} size="md" onClick={props.onStart} style={{ left: 760, top: 900 }} />
    </>
  );
}
