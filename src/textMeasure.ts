/** Measure Do Hyeon after the face has actually loaded. */

const DISPLAY_FONT = '"Do Hyeon", sans-serif';

export async function whenFontsReady(): Promise<void> {
  if (document.fonts?.load) {
    await document.fonts.load(`80px ${DISPLAY_FONT}`);
    await document.fonts.load(`40px ${DISPLAY_FONT}`);
  }
  if (document.fonts?.ready) await document.fonts.ready;
}

export function measureDisplayWidth(text: string, fontSize: number, lineHeight = fontSize): number {
  const el = document.createElement("span");
  el.style.cssText = [
    "position:absolute",
    "left:0",
    "top:0",
    "visibility:hidden",
    "pointer-events:none",
    "white-space:nowrap",
    `font-family:${DISPLAY_FONT}`,
    "font-weight:400",
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
