import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4173";
const OUT = path.resolve("screenshots/games/playthrough");
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

async function open(code) {
  await page.goto(`http://127.0.0.1:${PORT}/?screen=${encodeURIComponent(code)}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
}

async function clickLabel(label) {
  const handle = await page.waitForFunction(
    (text) => {
      const buttons = [...document.querySelectorAll("button")];
      return buttons.find((b) => (b.textContent || "").trim() === text) || null;
    },
    { timeout: 5000 },
    label,
  );
  const el = await handle.asElement();
  if (!el) throw new Error(`no button ${label}`);
  await el.click();
}

async function shot(name) {
  await new Promise((r) => setTimeout(r, 80));
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, type: "png" });
  console.log("wrote", file);
}

async function waitForTurnResult() {
  await page.waitForFunction(() => document.body.innerText.includes("차례 결과"), { timeout: 5000 });
}

// Game 1: open tiles until the result overlay, then reveal.
await open("02-play");
await page.waitForSelector(".mine-tile.is-closed");
for (let i = 0; i < 25; i++) {
  const ended = await page.$(".game-overlay");
  if (ended) break;
  const closed = await page.$$(".mine-tile.is-closed");
  if (!closed.length) break;
  await closed[0].click();
  await new Promise((r) => setTimeout(r, 30));
}
if (!(await page.$(".game-overlay"))) throw new Error("game1 did not end");
await clickLabel("결과 공개");
await waitForTurnResult();
await shot("game1-turn-result");
console.log("ok game1");

// Game 2: skip 20 problems.
await open("03-play");
for (let i = 0; i < 20; i++) {
  if (await page.$(".game-overlay")) break;
  await clickLabel("스킵");
  await new Promise((r) => setTimeout(r, 20));
}
if (!(await page.$(".game-overlay"))) throw new Error("game2 did not end after skips");
await clickLabel("결과 공개");
await waitForTurnResult();
await shot("game2-turn-result");
console.log("ok game2");

// Game 3: skip 20 problems.
await open("04-play");
for (let i = 0; i < 20; i++) {
  if (await page.$(".game-overlay")) break;
  await clickLabel("스킵");
  await new Promise((r) => setTimeout(r, 20));
}
if (!(await page.$(".game-overlay"))) throw new Error("game3 did not end after skips");
await clickLabel("결과 공개");
await waitForTurnResult();
await shot("game3-turn-result");
console.log("ok game3");

// Game 4: start, stop, reveal.
await open("05-play");
await clickLabel("시작");
await new Promise((r) => setTimeout(r, 400));
await clickLabel("멈춤");
if (!(await page.$(".game-overlay"))) throw new Error("game4 did not stop");
await clickLabel("결과 공개");
await waitForTurnResult();
await shot("game4-turn-result");
console.log("ok game4");

// Game 5: already running, stop, reveal.
await open("06-play");
await clickLabel("멈춤");
if (!(await page.$(".game-overlay"))) throw new Error("game5 did not stop");
await clickLabel("결과 공개");
await waitForTurnResult();
await shot("game5-turn-result");
console.log("ok game5");

await browser.close();
console.log("all playthroughs reached the turn result screen");
