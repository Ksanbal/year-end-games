import { copy } from "../copy.ts";
import { Coin } from "../ui/Coin.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";

export function Opening({ onPickTeams }: { onPickTeams: () => void }) {
  return (
    <>
      <Coin size={108} left={475.5} top={418} />
      <Coin size={108} left={1336.5} top={418} />
      <div
        className="text-display text-center"
        style={{ position: "absolute", left: 0, top: 400, width: 1920, height: 144, fontSize: 120, lineHeight: "144px" }}
      >
        {copy.appTitle}
      </div>
      <PrimaryButton label={copy.pickTeams} onClick={onPickTeams} style={{ left: 760, top: 860 }} />
    </>
  );
}
