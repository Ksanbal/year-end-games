import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { stateForScreen } from "../jump.ts";
import { MINE_COUNT } from "../games/game1/board.ts";
import { SLOT_PAYOUT_MULTIPLIER } from "../games/catalog.ts";
import { copy } from "../copy.ts";
import { staticFrameFor } from "./GameExplain.tsx";

describe("explanation screens", () => {
  it("opens each fixture at its explanation phase", () => {
    for (const [code, round] of [["01-E", 1], ["03-E", 2], ["04-E", 3], ["05-E", 4], ["06-E", 5]] as const) {
      expect(stateForScreen(code)?.state.phase).toEqual({ kind: "gameExplain", round });
    }
    expect(stateForScreen("09-E")?.state).toEqual({ ...stateForScreen("09-0")!.state, phase: { kind: "slotExplain" } });
  });

  it("uses the confirmed explanation copy and uses the configured counts", () => {
    expect(copy.explainMine).toBe(`지뢰 ${MINE_COUNT}개 · 한 번 누를 때 타일 하나 · 열린 타일마다 1점`);
    expect(copy.explainCountry).toBe("카드를 눌러 나라 이름을 완성하세요 (띄어쓰기 없이)");
    expect(copy.explainIdiom).toBe("1분 동안 사자성어를 최대한 많이 맞혀요.");
    expect(copy.explainTimer).toBe("10초에 가장 가깝게 멈추면 이겨요.");
    expect(copy.explainHidden).toBe("시작부터 끝까지 숫자를 보여 주지 않아요");
    expect(copy.explainSlot).toBe(`777이 나오면 코인 ${SLOT_PAYOUT_MULTIPLIER}배를 얻을 수 있어요`);
    expect(copy.goPlayGame).toBe("게임하러 가기");
  });

  it("selects the specified still frame for reduced motion", () => {
    expect([1, 2, 3, 4, 5, "slot"].map(id => staticFrameFor(id as 1 | 2 | 3 | 4 | 5 | "slot"))).toEqual([3, 2, 2, 3, 3, 1]);
  });

  it("disables the progress pulse for reduced motion and limits all-in animations", () => {
    const tokens = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");
    expect(tokens).toMatch(/--motion-allin-iterations:\s*3\s*;/);
    const screens = readFileSync(new URL("../styles/screens.css", import.meta.url), "utf8");
    const slot = readFileSync(new URL("../games/slot/slot.css", import.meta.url), "utf8");
    expect(screens).toMatch(/prefers-reduced-motion:[\s\S]*round-progress-dot\.is-current[\s\S]*animation:none/);
    expect(slot).toMatch(/slot-allin-glow var\(--motion-allin-glow\) ease-in-out var\(--motion-allin-iterations\)/);
    expect(slot).toMatch(/slot-allin-glow-rest/);
    expect(slot).not.toMatch(/animation:\s*slot-(?:allin-glow|allin-shine|twinkle)[^;]*infinite/);
  });
});
