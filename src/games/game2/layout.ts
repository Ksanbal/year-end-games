export const SLOT = 180;
export const SLOT_GAP = 24;
export const CARD = 180;
export const CARD_GAP = 32;
export const BACK_W = 187.5;
export const BACK_H = 140;
export const BACK_GAP = 36;
export const PANEL_PAD = 56;
export const PANEL_H = 250;

export type AnswerLayout = {
  panelX: number;
  panelY: number;
  panelW: number;
  panelH: number;
  slotX: number;
  slotY: number;
  backX: number;
  backY: number;
  cardX: number;
  cardY: number;
};

/** offsetY is 0 for game 2, 70 for game 3 (meaning block). */
export function answerLayout(count: number, offsetY: number): AnswerLayout {
  if (count === 4) {
    return {
      panelX: 396,
      panelY: 280 + offsetY,
      panelW: 1128,
      panelH: PANEL_H,
      slotX: 452,
      slotY: 315 + offsetY,
      backX: 1280,
      backY: 335 + offsetY,
      cardX: 552,
      cardY: 580 + offsetY,
    };
  }
  const slotsWidth = count * SLOT + Math.max(0, count - 1) * SLOT_GAP;
  const panelW = slotsWidth + BACK_GAP + BACK_W + PANEL_PAD * 2;
  const panelX = Math.round((1920 - panelW) / 2);
  const slotX = panelX + PANEL_PAD;
  const cardsWidth = count * CARD + Math.max(0, count - 1) * CARD_GAP;
  return {
    panelX,
    panelY: 280 + offsetY,
    panelW,
    panelH: PANEL_H,
    slotX,
    slotY: 315 + offsetY,
    backX: slotX + slotsWidth + BACK_GAP,
    backY: 335 + offsetY,
    cardX: Math.round((1920 - cardsWidth) / 2),
    cardY: 580 + offsetY,
  };
}
