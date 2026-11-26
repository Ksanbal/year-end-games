import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4182";
const OUT = process.env.OUT || "/workspace/year-end-games/screenshots-fixes-r2";

const SHOTS = [
  { file: "coin-08-1.png", query: "?screen=08-1" },
  { file: "coin-09-0.png", query: "?screen=09-0" },
  { file: "coin-09-1.png", query: "?screen=09-1", label: "slot-header" },
  { file: "coin-777.png", query: "?screen=09-3&burst=1", burst: true },
  { file: "coin-09-7.png", query: "?screen=09-7" },
  { file: "coin-10-1.png", query: "?screen=10-1" },
  { file: "coin-10-3.png", query: "?screen=10-3" },
  { file: "coin-00-0.png", query: "?screen=00-0" },
  { file: "coin-00-1.png", query: "?screen=00-1" },
];

const REDUCED = [
  { file: "coin-09-0-reduced.png", query: "?screen=09-0" },
  { file: "coin-09-7-reduced.png", query: "?screen=09-7" },
  { file: "coin-10-1-reduced.png", query: "?screen=10-1" },
  { file: "coin-777-reduced.png", query: "?screen=09-3&burst=1", burst: true },
];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

async function open(query) {
  await page.goto(`http://127.0.0.1:${PORT}/${query}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("img.coin-face, img.slot-allin-coin")];
    await Promise.all(
      imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      }))),
    );
  });
}

function measureCoins() {
  return page.evaluate(() => {
    const canvas = document.querySelector(".canvas");
    const scale = canvas ? canvas.getBoundingClientRect().width / 1920 : 1;
    const coins = [...document.querySelectorAll(".coin")].map((el) => {
      const img = el.querySelector("img.coin-face");
      const box = img ? img.getBoundingClientRect() : el.getBoundingClientRect();
      const cs = img ? getComputedStyle(img) : getComputedStyle(el);
      const transform = getComputedStyle(el).transform;
      let scaleX = 1;
      let scaleY = 1;
      const m = transform && transform !== "none" ? transform.match(/matrix\(([^)]+)\)/) : null;
      if (m) {
        const n = m[1].split(",").map(Number);
        scaleX = Math.hypot(n[0], n[1]);
        scaleY = Math.hypot(n[2], n[3]);
      }
      const width = box.width / scale;
      const height = box.height / scale;
      return {
        name: el.getAttribute("data-coin"),
        size: Number(el.getAttribute("data-coin-size")),
        className: el.className,
        left: box.left / scale,
        top: box.top / scale,
        width,
        height,
        ratio: width === 0 ? 0 : height / width,
        opacity: Number(getComputedStyle(el).opacity),
        filter: cs.filter,
        complete: img ? img.complete : false,
        naturalWidth: img ? img.naturalWidth : 0,
        naturalHeight: img ? img.naturalHeight : 0,
        currentSrc: img ? img.currentSrc : "",
        scaleX,
        scaleY,
      };
    });
    const allin = [...document.querySelectorAll("img.slot-allin-coin")].map((img) => {
      const box = img.getBoundingClientRect();
      return {
        className: img.className,
        width: box.width / scale,
        height: box.height / scale,
        src: img.getAttribute("src"),
        naturalWidth: img.naturalWidth,
      };
    });
    const issues = [];
    for (const coin of coins) {
      if (!coin.complete || coin.naturalWidth === 0) issues.push(`broken image: ${coin.name}`);
      if (Math.abs(coin.ratio - 1.12) > 0.02) issues.push(`aspect ${coin.ratio.toFixed(4)} on ${coin.name} @ ${coin.width.toFixed(2)}x${coin.height.toFixed(2)}`);
      // naturalWidth is density-corrected (HTML), so a 3x file of 258px reports 86 at 3x.
      if (coin.naturalWidth > 0 && coin.naturalWidth + 0.5 < coin.size) {
        issues.push(`low-res ${coin.name}: naturalWidth ${coin.naturalWidth} < size ${coin.size}`);
      }
    }
    return { scale, coins, allin, issues, burstCount: document.querySelectorAll(".slot-burst-coin").length };
  });
}

async function pauseBurstAt(progress) {
  return page.evaluate((progress) => {
    const coins = [...document.querySelectorAll(".slot-burst-coin")];
    const sizes = [];
    for (const el of coins) {
      const anims = el.getAnimations();
      for (const anim of anims) {
        const duration = anim.effect && "getComputedTiming" in anim.effect
          ? anim.effect.getComputedTiming().duration
          : 1500;
        const delay = anim.effect && "getComputedTiming" in anim.effect
          ? anim.effect.getComputedTiming().delay
          : 0;
        const dur = typeof duration === "number" ? duration : 1500;
        anim.currentTime = delay + dur * progress;
        anim.pause();
      }
      const img = el.querySelector("img.coin-face");
      const box = (img ?? el).getBoundingClientRect();
      const transform = getComputedStyle(el).transform;
      let scaleX = 1;
      let scaleY = 1;
      const m = transform && transform !== "none" ? transform.match(/matrix\(([^)]+)\)/) : null;
      if (m) {
        const n = m[1].split(",").map(Number);
        scaleX = Math.hypot(n[0], n[1]);
        scaleY = Math.hypot(n[2], n[3]);
      }
      sizes.push({
        width: box.width,
        height: box.height,
        opacity: Number(getComputedStyle(el).opacity),
        scaleX,
        scaleY,
      });
    }
    return sizes;
  }, progress);
}

const report = [];

for (const shot of SHOTS) {
  await open(shot.query);
  let burst = null;
  if (shot.burst) {
    await page.waitForSelector(".slot-burst-coin");
    const at80 = await pauseBurstAt(0.8);
    const at100 = await pauseBurstAt(1);
    // Leave the screenshot at 80%, when coins are still fully opaque.
    await pauseBurstAt(0.8);
    const max80 = at80.reduce((best, c) => (c.width * c.height > best.width * best.height ? c : best), at80[0]);
    const max100 = at100.reduce((best, c) => (c.width * c.height > best.width * best.height ? c : best), at100[0]);
    burst = { at80: max80, at100: max100, samples80: at80.length, samples100: at100.length };
  } else {
    await new Promise((r) => setTimeout(r, 120));
  }
  const measured = await measureCoins();
  const file = path.join(OUT, shot.file);
  await page.screenshot({ path: file, type: "png" });
  report.push({ file: shot.file, query: shot.query, ...measured, burst });
  console.log(JSON.stringify({ file: shot.file, issues: measured.issues, coins: measured.coins, allin: measured.allin, burst }, null, 2));
}

const reducedReport = [];
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
for (const shot of REDUCED) {
  await open(shot.query);
  await new Promise((r) => setTimeout(r, 200));
  const measured = await measureCoins();
  const file = path.join(OUT, shot.file);
  await page.screenshot({ path: file, type: "png" });
  reducedReport.push({ file: shot.file, query: shot.query, ...measured });
  console.log(JSON.stringify({
    file: shot.file,
    reduced: true,
    issues: measured.issues,
    coinCount: measured.coins.length,
    burstCount: measured.burstCount,
    coins: measured.coins,
  }, null, 2));
}

const allIssues = [...report, ...reducedReport].flatMap((row) => row.issues ?? []);
if (allIssues.length) {
  console.error("coin issues:", allIssues);
  await browser.close();
  process.exit(1);
}
console.log("all coin screens passed");
await browser.close();
