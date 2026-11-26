import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4181";
const OUT = process.env.OUT || "/workspace/year-end-games/screenshots-fixes-r1";

function overlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function fmt(r) {
  return `x=${r.x.toFixed(1)} y=${r.y.toFixed(1)} w=${r.width.toFixed(1)} h=${r.height.toFixed(1)} [${r.top.toFixed(1)}-${r.bottom.toFixed(1)}]`;
}

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

const screens = ["03-2", "04-2", "04-2-long"];
const failures = [];

for (const code of screens) {
  await page.goto(`http://127.0.0.1:${PORT}/?screen=${encodeURIComponent(code)}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 150));

  const measured = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left };
    };
    const canvas = document.querySelector(".canvas");
    const scale = canvas ? Number.parseFloat(getComputedStyle(canvas).transform.split("(")[1] || "1") : 1;
    const wrong = box(document.querySelector(".word-wrong"));
    const meaning = box(document.querySelector(".word-meaning"));
    const meaningLabel = box(document.querySelector(".word-meaning-label"));
    const cards = [...document.querySelectorAll(".word-card")].map(box);
    const slots = [...document.querySelectorAll(".word-slot")].map(box);
    const skip = box([...document.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "스킵"));
    const panel = box(document.querySelector(".card")) || box(document.querySelector("[class*='surface-answer']"));
    return {
      scale,
      text: document.body.innerText,
      wrong,
      meaning,
      meaningLabel,
      cards,
      slots,
      skip,
      panel,
    };
  });

  const file = path.join(OUT, `bbox-${code}.png`);
  await page.screenshot({ path: file, type: "png" });
  console.log(`\n=== ${code}  scale=${measured.scale}  shot=${file} ===`);
  console.log("wrong", measured.wrong ? fmt(measured.wrong) : "MISSING");
  console.log("meaning", measured.meaning ? fmt(measured.meaning) : "none");
  console.log("meaningLabel", measured.meaningLabel ? fmt(measured.meaningLabel) : "none");
  console.log("skip", measured.skip ? fmt(measured.skip) : "MISSING");
  console.log("panel", measured.panel ? fmt(measured.panel) : "MISSING");
  measured.cards.forEach((c, i) => console.log(`card[${i}]`, fmt(c)));
  measured.slots.forEach((c, i) => console.log(`slot[${i}]`, fmt(c)));
  if (measured.meaning) console.log("meaning text:", JSON.stringify((measured.text.split("\n").find((l) => l.length > 20) || "").slice(0, 80)));

  const pairs = [];
  if (!measured.wrong) failures.push(`${code}: missing .word-wrong`);
  if (!measured.skip) failures.push(`${code}: missing 스킵`);
  if (measured.wrong) {
    for (const [i, card] of measured.cards.entries()) pairs.push([`wrong vs card[${i}]`, measured.wrong, card]);
    for (const [i, slot] of measured.slots.entries()) pairs.push([`wrong vs slot[${i}]`, measured.wrong, slot]);
    if (measured.skip) pairs.push(["wrong vs skip", measured.wrong, measured.skip]);
    if (measured.meaning) pairs.push(["wrong vs meaning", measured.wrong, measured.meaning]);
  }
  if (measured.meaning) {
    for (const [i, card] of measured.cards.entries()) pairs.push([`meaning vs card[${i}]`, measured.meaning, card]);
    for (const [i, slot] of measured.slots.entries()) pairs.push([`meaning vs slot[${i}]`, measured.meaning, slot]);
    if (measured.panel) pairs.push(["meaning vs panel", measured.meaning, measured.panel]);
  }
  if (measured.meaningLabel && measured.meaning) {
    pairs.push(["meaningLabel vs meaning", measured.meaningLabel, measured.meaning]);
  }
  if (measured.skip) {
    for (const [i, card] of measured.cards.entries()) pairs.push([`skip vs card[${i}]`, measured.skip, card]);
  }

  for (const [name, a, b] of pairs) {
    if (!a || !b) continue;
    if (overlap(a, b)) {
      const msg = `${code}: overlap ${name}\n  a ${fmt(a)}\n  b ${fmt(b)}`;
      console.log("FAIL", msg);
      failures.push(msg);
    }
  }
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} overlap(s):`);
  for (const f of failures) console.error("-", f);
  process.exit(1);
}
console.log("\nno overlaps on 03-2, 04-2, or 04-2-long");
