import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { stateForScreen } from "../jump.ts";
import { copy } from "../copy.ts";
import { EXPLAIN_LINE_SLOT_TODO } from "./explainCopy.ts";
import { staticFrameFor } from "./GameExplain.tsx";

describe("explanation screens", () => {
  it("opens each fixture at its explanation phase", () => {
    for (const [code, round] of [["01-E", 1], ["03-E", 2], ["04-E", 3], ["05-E", 4], ["06-E", 5]] as const) {
      expect(stateForScreen(code)?.state.phase).toEqual({ kind: "gameExplain", round });
    }
    expect(stateForScreen("09-E")?.state).toEqual({ ...stateForScreen("09-0")!.state, phase: { kind: "slotExplain" } });
  });

  it("uses the confirmed explanation copy and keeps the lever line as a placeholder", () => {
    expect(copy.explainMine).toBe("지뢰 5개 · 한 번 누를 때 타일 하나 · 열린 타일마다 1점");
    expect(copy.explainCountry).toBe("카드를 눌러 나라 이름을 완성하세요 (띄어쓰기 없이)");
    expect(copy.explainGame3).toBe("10초에 가장 가깝게 멈추면 이겨요.");
    expect(copy.explainTimer).toBe("10.000초에 맞춰 멈추세요");
    expect(copy.explainHidden).toBe("시작부터 끝까지 숫자를 보여 주지 않아요");
    expect(copy.goPlayGame).toBe("게임하러 가기");
    expect(EXPLAIN_LINE_SLOT_TODO).toBe("〈설명 문구 대기 — Quill〉");
  });

  it("selects the specified still frame for reduced motion", () => {
    expect([1, 2, 3, 4, 5, "slot"].map(id => staticFrameFor(id as 1 | 2 | 3 | 4 | 5 | "slot"))).toEqual([3, 2, 2, 3, 3, 1]);
  });

  it("disables the progress pulse for reduced motion and limits all-in animations", () => {
    const screens = readFileSync(new URL("../styles/screens.css", import.meta.url), "utf8");
    const slot = readFileSync(new URL("../games/slot/slot.css", import.meta.url), "utf8");
    expect(screens).toMatch(/prefers-reduced-motion:[\s\S]*round-progress-dot\.is-current[\s\S]*animation:none/);
    expect(slot).toMatch(/slot-allin-glow var\(--motion-allin-glow\) ease-in-out var\(--motion-allin-iterations\)/);
    expect(slot).toMatch(/slot-allin-glow-rest/);
    expect(slot).not.toMatch(/animation:\s*slot-(?:allin-glow|allin-shine|twinkle)[^;]*infinite/);
  });
});
