import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4180";
const OUT = process.env.OUT || "/workspace/year-end-games/screenshots-fixes-r2";
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

async function goto(query) {
  await page.goto(`http://127.0.0.1:${PORT}/${query}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 150));
}

async function canvasPoint(x, y) {
  return page.evaluate((cx, cy) => {
    const canvas = document.querySelector(".canvas");
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.left + (cx / 1920) * rect.width,
      y: rect.top + (cy / 1080) * rect.height,
    };
  }, x, y);
}

async function dragLever(distance) {
  const start = await canvasPoint(1644, 300);
  const end = await canvasPoint(1644, 300 + distance);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    const y = start.y + ((end.y - start.y) * i) / steps;
    await page.mouse.move(start.x, y);
    await new Promise((r) => setTimeout(r, 16));
  }
  await page.mouse.up();
}

async function clickLabel(label, { last = false } = {}) {
  const found = await page.evaluate((text, lastMatch) => {
    const buttons = [...document.querySelectorAll("button")].filter((b) => b.textContent === text);
    const target = lastMatch ? buttons.at(-1) : buttons[0];
    target?.click();
    return Boolean(target);
  }, label, last);
  if (!found) throw new Error(`button not found: ${label}`);
}

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, type: "png" });
  console.log("wrote", file);
}

function bodyText() {
  return page.evaluate(() => document.body.innerText);
}

// Start from the designed slot intro: coins [170, 190, 90], order 3팀 → 1팀 → 2팀.
await goto("?screen=09-0&e2e=1");
await page.click("button", { delay: 20 });
await new Promise((r) => setTimeout(r, 250));

// 3팀 (90) all-in and lose, which should land on the zero-coin result.
await clickLabel("올인");
await new Promise((r) => setTimeout(r, 150));
await clickLabel("올인", { last: true });
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  window.__slot?.setNextStops(["seven", "cherry", "bell"]);
});
await dragLever(220);
await new Promise((r) => setTimeout(r, 5800));
const allInText = await bodyText();
if (!allInText.includes("90코인을 잃었어요") || !allInText.includes("90 → 0코인") || !allInText.includes("가진 코인 0")) {
  throw new Error(`expected zero-coin all-in loss, got: ${allInText.slice(0, 400)}`);
}
if (allInText.includes("베팅하기") || allInText.includes("베팅 바꾸기")) {
  throw new Error("betting UI should be hidden on the zero-coin result");
}
await shot("play-allin-loss.png");
await clickLabel("다음 팀");
await new Promise((r) => setTimeout(r, 250));

// 1팀 (170) skips, staying at 170.
await clickLabel("건너뛰기");
await new Promise((r) => setTimeout(r, 200));
await clickLabel("다음 팀");
await new Promise((r) => setTimeout(r, 250));

// 2팀 (190). Default bet is 1, so +10 twice then −1 lands on 20.
for (let i = 0; i < 2; i++) await clickLabel("+10");
await clickLabel("−1");
await clickLabel("베팅하기");
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  window.__slot?.setNextStops(["seven", "cherry", "bell"]);
});
await dragLever(220);
await new Promise((r) => setTimeout(r, 5800));
await clickLabel("최종 결과 공개");
await new Promise((r) => setTimeout(r, 300));
const finalText = await bodyText();
if (!finalText.includes("최종 공동 1등 1팀 · 2팀")) {
  throw new Error(`expected tied final title, got: ${finalText.slice(0, 400)}`);
}
if (!finalText.includes("공동 1등") || !finalText.includes("3등")) {
  throw new Error(`expected 공동 1등 and 3등 ranks, got: ${finalText.slice(0, 400)}`);
}
await shot("play-final-tie.png");
console.log("playthrough reached a tied final after a lost all-in");

await browser.close();
