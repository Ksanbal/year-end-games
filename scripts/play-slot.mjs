import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4180";
const OUT = path.resolve("screenshots/slot");
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

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, type: "png" });
  console.log("wrote", file);
}

// Short pull that must spring back.
await goto("?screen=09-1b&e2e=1");
const before = await page.evaluate(() => window.__slot?.getView());
await dragLever(80);
await new Promise((r) => setTimeout(r, 400));
const afterShort = await page.evaluate(() => ({
  view: window.__slot?.getView(),
  pull: window.__slot?.getPull(),
}));
await shot("drag-short-pull.png");
if (afterShort.view !== "ready" || afterShort.pull > 2) {
  throw new Error(`short pull should spring back, got ${JSON.stringify(afterShort)} (started ${before})`);
}
console.log("short pull sprang back", afterShort);

// Full pull that spins, forced miss so the result is deterministic.
await goto("?screen=09-1b&e2e=1");
await page.evaluate(() => window.__slot?.setNextStops(["seven", "cherry", "bell"]));
await dragLever(200);
await new Promise((r) => setTimeout(r, 250));
const mid = await page.evaluate(() => ({
  view: window.__slot?.getView(),
  pull: window.__slot?.getPull(),
}));
await shot("drag-full-pull.png");
if (mid.view !== "spinning") {
  throw new Error(`full pull should spin, got ${JSON.stringify(mid)}`);
}
console.log("full pull started spin", mid);
await new Promise((r) => setTimeout(r, 5600));
const settled = await page.evaluate(() => window.__slot?.getView());
if (settled !== "result") {
  throw new Error(`expected result after spin, got ${settled}`);
}
await shot("drag-full-result.png");
console.log("full pull settled on result");

// Full slot phase for all three teams, then the final result.
await goto("?screen=09-0&e2e=1");
await page.click("button", { delay: 20 });
// After 첫 팀 시작, first team is 3팀 (90 coins). Skip.
await new Promise((r) => setTimeout(r, 200));
const skip = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")];
  const target = buttons.find((b) => b.textContent === "건너뛰기");
  target?.click();
  return Boolean(target);
});
if (!skip) throw new Error("skip button not found for team 1");
await new Promise((r) => setTimeout(r, 200));
await shot("phase-team1-skip.png");
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")];
  buttons.find((b) => b.textContent === "다음 팀")?.click();
});
await new Promise((r) => setTimeout(r, 250));

// Second team (1팀, 170). Bet 20 via +10 twice, place, force 777, pull.
for (let i = 0; i < 2; i++) {
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    buttons.find((b) => b.textContent === "+10")?.click();
  });
}
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")];
  buttons.find((b) => b.textContent === "베팅하기")?.click();
});
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  window.__slot?.setNextStops(["seven", "seven", "seven"]);
});
await dragLever(220);
await new Promise((r) => setTimeout(r, 5800));
await shot("phase-team2-win.png");
const team2 = await page.evaluate(() => document.body.innerText);
if (!team2.includes("777!")) throw new Error("expected 777 result for team 2");
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")];
  buttons.find((b) => b.textContent === "다음 팀")?.click();
});
await new Promise((r) => setTimeout(r, 250));

// Finish the seven remaining turns in team order.
for (let turn = 3; turn <= 9; turn++) {
  await page.locator('::-p-text(건너뛰기)').click();
  if (turn === 3) await shot("phase-team3-skip.png");
  await page.locator(turn === 9 ? '::-p-text(최종 결과 공개)' : '::-p-text(다음 팀)').click();
}
await page.waitForSelector(".final-title-row");
const finalText = await page.evaluate(() => document.body.innerText);
if (!finalText.includes("최종 결과") && !finalText.includes("최종 1등")) {
  throw new Error(`expected final result, got: ${finalText.slice(0, 200)}`);
}
await shot("phase-final.png");
console.log("full phase reached final result");

await browser.close();
