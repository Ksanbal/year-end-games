import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4182";
const OUT = process.env.OUT || "/workspace/year-end-games/screenshots-fixes-r3";
const SAFE_LEFT = 80;
const SAFE_RIGHT = 1840;
const SAFE = SAFE_RIGHT - SAFE_LEFT;

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
    file: "final-title-default-3tie.png",
    expectTitle: "최종 공동 1등 1팀 · 2팀 · 3팀",
    expectFont: 80,
    expectCoins: true,
  },
  {
    code: "10-3",
    file: "final-title-default-2tie.png",
    expectTitle: "최종 공동 1등 1팀 · 2팀",
    expectFont: 80,
    expectCoins: true,
  },
  {
    code: "10-3-6",
    file: "final-title-6char-3tie.png",
    expectTitle: "최종 공동 1등 가나다라마바 · 가나다라마사 · 가나다라마아",
    expectFont: "shrink",
    expectCoins: true,
  },
  {
    code: "10-3-7",
    file: "final-title-7char-3tie.png",
    expectTitle: "최종 공동 1등 가나다라마바사 · 가나다라마바아 · 가나다라마바자",
    expectFont: "shrink",
    expectCoins: true,
  },
  {
    code: "10-3long",
    file: "final-title-8char-3tie.png",
    expectTitle: "최종 공동 1등 가나다라마바사아 · 가나다라마바사자 · 가나다라마바사차",
    expectFont: 64,
    expectCoins: false,
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
    const coins = [...row.querySelectorAll(".coin")].map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    });
    return {
      title: text.textContent,
      fontSize: parseFloat(style.fontSize),
      lineHeight: style.lineHeight,
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
      showCoins: row.getAttribute("data-show-coins") === "true",
      coinCount: coins.length,
      textWidth: text.getBoundingClientRect().width,
      rowWidth: row.scrollWidth,
      clusterWidth: text.getBoundingClientRect().width + (coins.length === 2 ? 216 : 0),
      coins,
    };
  });

  const file = path.join(OUT, item.file);
  await page.screenshot({ path: file, type: "png" });

  const failures = [];
  if (measured.title !== item.expectTitle) {
    failures.push(`title: got ${JSON.stringify(measured.title)}`);
  }
  if (item.expectFont === "shrink") {
    if (measured.fontSize < 64 || measured.fontSize >= 80) {
      failures.push(`fontSize: got ${measured.fontSize}, expected 64 <= size < 80`);
    }
  } else if (Math.abs(measured.fontSize - item.expectFont) > 0.5) {
    failures.push(`fontSize: got ${measured.fontSize}, expected ${item.expectFont}`);
  }
  if (measured.showCoins !== item.expectCoins || (measured.coinCount === 2) !== item.expectCoins) {
    failures.push(`coins: show=${measured.showCoins} count=${measured.coinCount}`);
  }
  if (measured.whiteSpace !== "nowrap") failures.push(`white-space: ${measured.whiteSpace}`);
  if (measured.textOverflow && measured.textOverflow !== "clip") {
    failures.push(`text-overflow: ${measured.textOverflow}`);
  }
  if (measured.clusterWidth > SAFE + 0.5) {
    failures.push(`cluster ${measured.clusterWidth} exceeds safe width ${SAFE}`);
  }
  for (const coin of measured.coins) {
    if (coin.left < SAFE_LEFT - 0.5 || coin.right > SAFE_RIGHT + 0.5) {
      failures.push(`coin ${coin.left.toFixed(1)}–${coin.right.toFixed(1)} outside ${SAFE_LEFT}–${SAFE_RIGHT}`);
    }
  }

  results.push({ code: item.code, file, measured, failures });
  console.log(JSON.stringify({ code: item.code, file, measured, failures }, null, 2));
  if (failures.length) {
    throw new Error(`${item.code} failed: ${failures.join("; ")}`);
  }
}

await browser.close();
console.log("all final-title cases passed");
