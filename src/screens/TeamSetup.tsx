import { copy } from "../copy.ts";
import { MAX_NAME_LENGTH } from "../games/catalog.ts";
import { codePointLength } from "../state/names.ts";
import type { TeamIndex } from "../state/types.ts";
import { Coin } from "../ui/Coin.tsx";
import { PrimaryButton } from "../ui/PrimaryButton.tsx";

export function TeamSetup(props: {
  names: [string, string, string];
  errors: Set<TeamIndex>;
  canStart: boolean;
  onChange: (index: TeamIndex, name: string) => void;
  onStart: () => void;
}) {
  return (
    <>
      <div
        className="text-ui text-center"
        style={{
          position: "absolute",
          left: 0,
          top: 96,
          width: 1920,
          height: 43,
          fontSize: 36,
          fontWeight: 700,
          lineHeight: "43px",
          color: "var(--color-text-secondary)",
        }}
      >
        {copy.appTitle}
      </div>
      <div
        className="text-display text-center"
        style={{ position: "absolute", left: 0, top: 150, width: 1920, height: 77, fontSize: 64, lineHeight: "77px" }}
      >
        {copy.setTeamNames}
      </div>
      <Coin size={58} left={616} top={159.5} />
      <Coin size={58} left={1246} top={159.5} />
      {([0, 1, 2] as const).map((index) => (
        <TeamRow
          key={index}
          index={index}
          name={props.names[index]}
          error={props.errors.has(index)}
          onChange={props.onChange}
        />
      ))}
      <PrimaryButton
        label={copy.startGame}
        disabled={!props.canStart}
        onClick={props.onStart}
        style={{ left: 760, top: 860 }}
      />
    </>
  );
}

function TeamRow(props: {
  index: TeamIndex;
  name: string;
  error: boolean;
  onChange: (index: TeamIndex, name: string) => void;
}) {
  const top = 410 + props.index * 130;
  const labelTop = top + 34;
  const countTop = top + 32;
  return (
    <>
      <div
        className="text-ui"
        style={{
          position: "absolute",
          left: 560,
          top: labelTop,
          fontSize: 32,
          fontWeight: 700,
          lineHeight: "38px",
        }}
      >
        {copy.teamLabel((props.index + 1) as 1 | 2 | 3)}
      </div>
      <input
        className={props.error ? "team-input is-error" : "team-input"}
        value={props.name}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => props.onChange(props.index, event.target.value)}
        style={{ left: 700, top }}
      />
      <div
        className="text-ui"
        style={{
          position: "absolute",
          left: 1250,
          top: countTop,
          fontSize: 28,
          fontWeight: 500,
          lineHeight: "34px",
          color: "var(--color-text-secondary)",
        }}
      >
        {copy.charCount(codePointLength(props.name))}
      </div>
    </>
  );
}
