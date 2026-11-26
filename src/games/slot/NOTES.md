# 운명의 레버 — defaults and gaps

## Defaults chosen (undefined motion / behavior)

- Reel spin direction is downward. Speed is 1200 px/s on a 100 px pitch (7, cherry, bell, repeating).
- Reels all spin for 3 s, then stop left to right 1 s apart (3.0 / 4.0 / 5.0 s), as already set in DECISIONS.md and motion.md. The undefined stop easing is a 400 ms ease-out with a slight overshoot (damped sine, 24 px in the helper).
- `prefers-reduced-motion`: no rotation. Each reel keeps the faded stacked 7 / cherry / bell until its stop time, then the stopped symbol appears in place.
- 777 effect: the designed gold 8 px reel border, plus a 1.5 s coin burst and a gold glow pulse. Reduced motion keeps only the static gold border.
- Odds follow DECISIONS.md: each reel is independently 7, cherry, or bell at 1/3 (777 is 1/27).
- After a failed lever pull, the handle springs back in 250 ms ease-out with a small sine bounce.
- `SlotModule.Done` immediately calls `onRevealFinal`. The last team's result screen already has [최종 결과 공개], so a second empty done screen is not shown.

## Copy gaps

- There is no mid-team skip frame. The screen uses the 09-5 layout and copy pattern (`{팀}은/는 돌리지 않고 넘어가요`, `코인 그대로 N`) with [다음 팀] from 09-3 / 09-4.
- There is no last-team win or lose frame. Those results keep the 09-3 / 09-4 layout and use the designed [최종 결과 공개] label from 09-5.
- The 은/는 particle is chosen from the name's last syllable. The 본안 only shows `2팀은`.
- A team with 0 coins cannot place a bet and can only skip. That empty state is not in the 본안.

## Shared files touched

- `src/jump.ts`: `?screen=09-1` … `09-6` fixtures (slot turn at the example campaign).
- `src/App.tsx`: `readJump()` runs inside `App` so a new `?screen=` is applied on each load.
- `package.json`: `screenshots:slot` and `play:slot`.

## How to verify

The foundation worktree often holds port 4173. Serve this worktree on 4180:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4180
PORT=4180 npm test
PORT=4180 npm run screenshots:slot
PORT=4180 npm run play:slot
```

Screenshots: `screenshots/slot/09-*.png`, plus `drag-*.png` and `phase-*.png` from the play script.
