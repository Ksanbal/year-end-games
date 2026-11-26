import { copy } from "../copy.ts";
import { Card } from "../ui/Card.tsx";
import { Coin } from "../ui/Coin.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";
import { gameIntroRows } from "./gameIntro.ts";

export function GameIntro({ onPickTeams }: { onPickTeams: () => void }) {
  return (
    <>
      <div className="game-intro-title">
        <Coin size={58} style={{ position: "relative" }} />
        <div className="text-display" style={{ fontSize: 64, lineHeight: "77px" }}>
          {copy.appTitle}
        </div>
        <Coin size={58} style={{ position: "relative" }} />
      </div>
      <Card x={460} y={280} w={1000} h={520} radius={36} shadow>
        {gameIntroRows().map((row, index) => (
          <div key={row.label} className="game-intro-row" style={{ top: 20 + index * 80 }}>
            <div className="game-intro-label">{row.label}</div>
            <div className="game-intro-name">
              {row.name}
              {row.showCoin ? <Coin size={36} style={{ position: "relative", marginLeft: 12 }} /> : null}
            </div>
          </div>
        ))}
        <div className="game-intro-rule" />
      </Card>
      <PrimaryButton label={copy.pickTeams} onClick={onPickTeams} style={{ left: 760, top: 860 }} />
    </>
  );
}
