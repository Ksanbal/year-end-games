/** Measure a face after it has actually loaded. */

export const DISPLAY_FONT = '"Do Hyeon", sans-serif';
export const UI_FONT = '"Pretendard Variable", Pretendard, sans-serif';

export type MeasureFont = {
  family: string;
  weight: number;
};

export const DISPLAY_MEASURE: MeasureFont = { family: DISPLAY_FONT, weight: 400 };
export const UI_BOLD_MEASURE: MeasureFont = { family: UI_FONT, weight: 700 };

export async function whenFontsReady(): Promise<void> {
  if (document.fonts?.load) {
    await document.fonts.load(`80px ${DISPLAY_FONT}`);
    await document.fonts.load(`40px ${DISPLAY_FONT}`);
    await document.fonts.load(`700 36px ${UI_FONT}`);
    await document.fonts.load(`700 40px ${UI_FONT}`);
  }
  if (document.fonts?.ready) await document.fonts.ready;
}

export function measureTextWidth(
  text: string,
  fontSize: number,
  lineHeight = fontSize,
  font: MeasureFont = DISPLAY_MEASURE,
): number {
  const el = document.createElement("span");
  el.style.cssText = [
    "position:absolute",
    "left:0",
    "top:0",
    "visibility:hidden",
    "pointer-events:none",
    "white-space:nowrap",
    `font-family:${font.family}`,
    `font-weight:${font.weight}`,
    "font-style:normal",
    `font-size:${fontSize}px`,
    `line-height:${lineHeight}px`,
  ].join(";");
  el.textContent = text;
  document.body.appendChild(el);
  const width = el.getBoundingClientRect().width;
  el.remove();
  return width;
}

export function measureDisplayWidth(text: string, fontSize: number, lineHeight = fontSize): number {
  return measureTextWidth(text, fontSize, lineHeight, DISPLAY_MEASURE);
}

export function measureUiBoldWidth(text: string, fontSize: number, lineHeight = fontSize): number {
  return measureTextWidth(text, fontSize, lineHeight, UI_BOLD_MEASURE);
}
