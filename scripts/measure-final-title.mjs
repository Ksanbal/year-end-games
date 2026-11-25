import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4182";
const OUT = process.env.OUT || "/workspace/year-end-games/screenshots-fixes-r2";
const SAFE = 1920 - 80 * 2;

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

const cases = [
  {
    code: "10-3all",
    file: "10-3all.png",
    expectTitle: "최종 공동 1등 1팀 · 2팀 · 3팀",
    expectFont: 80,
    expectCoins: true,
  },
  {
    code: "10-3long",
    file: "10-3long.png",
    expectTitle: "최종 공동 1등 가나다라마바사아 · 가나다라마바사자 · 가나다라마바사차",
    expectFont: 64,
    expectCoins: false,
  },
  {
    code: "10-3",
    file: "10-3.png",
    expectTitle: "최종 공동 1등 1팀 · 2팀",
    expectFont: 80,
    expectCoins: true,
  },
];

const results = [];

for (const item of cases) {
  await page.goto(`http://127.0.0.1:${PORT}/?screen=${encodeURIComponent(item.code)}`, {
    waitUntil: "networkidle0",
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector('.final-title-row[data-final-title-ready="true"]');
  await new Promise((r) => setTimeout(r, 150));

  const measured = await page.evaluate(() => {
    const row = document.querySelector(".final-title-row");
    const text = document.querySelector(".final-title-text");
    if (!row || !text) throw new Error("final title row missing");
    const style = getComputedStyle(row);
    return {
      title: text.textContent,
      fontSize: parseFloat(style.fontSize),
      lineHeight: style.lineHeight,
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
      showCoins: row.getAttribute("data-show-coins") === "true",
      coinCount: row.querySelectorAll(".coin").length,
      textWidth: text.offsetWidth,
      rowWidth: row.scrollWidth,
      clusterWidth: text.offsetWidth + (row.querySelectorAll(".coin").length === 2 ? 216 : 0),
    };
  });

  const file = path.join(OUT, item.file);
  await page.screenshot({ path: file, type: "png" });

  const failures = [];
  if (measured.title !== item.expectTitle) {
    failures.push(`title: got ${JSON.stringify(measured.title)}`);
  }
  if (Math.abs(measured.fontSize - item.expectFont) > 0.5) {
    failures.push(`fontSize: got ${measured.fontSize}, expected ${item.expectFont}`);
  }
  if (measured.showCoins !== item.expectCoins || (measured.coinCount === 2) !== item.expectCoins) {
    failures.push(`coins: show=${measured.showCoins} count=${measured.coinCount}`);
  }
  if (measured.whiteSpace !== "nowrap") failures.push(`white-space: ${measured.whiteSpace}`);
  if (measured.textOverflow && measured.textOverflow !== "clip") {
    failures.push(`text-overflow: ${measured.textOverflow}`);
  }
  if (measured.clusterWidth > SAFE) {
    failures.push(`cluster ${measured.clusterWidth} exceeds safe width ${SAFE}`);
  }
  if (item.expectFont === 80 && measured.clusterWidth > SAFE) {
    failures.push("default title should not overflow");
  }

  results.push({ code: item.code, file, measured, failures });
  console.log(JSON.stringify({ code: item.code, file, measured, failures }, null, 2));
  if (failures.length) {
    throw new Error(`${item.code} failed: ${failures.join("; ")}`);
  }
}

await browser.close();
console.log("all final-title cases passed");
