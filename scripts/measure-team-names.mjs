import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4182";
const OUT = process.env.OUT || "/workspace/year-end-games/screenshots-fixes-r2";

const SCREENS = [
  { file: "long-10-1.png", query: "?screen=10-1&long=1", expectNames: 3 },
  { file: "long-10-2.png", query: "?screen=10-2&long=1", expectNames: 3 },
  { file: "long-10-3.png", query: "?screen=10-3&long=1", expectNames: 3 },
  { file: "long-08-1.png", query: "?screen=08-1&long=1", expectNames: 3 },
  { file: "long-08-2.png", query: "?screen=08-2&long=1", expectNames: 3 },
  { file: "long-09-0.png", query: "?screen=09-0&long=1", expectNames: 3 },
  { file: "long-09-1.png", query: "?screen=09-1&long=1", expectNames: 1 },
  { file: "long-09-7.png", query: "?screen=09-7&long=1", expectNames: 1 },
  { file: "long-01-2.png", query: "?screen=01-2&long=1", expectNames: 3 },
  { file: "long-11-1.png", query: "?screen=11-1&long=1", expectNames: 1 },
  { file: "long-01-3.png", query: "?screen=01-3&long=1", expectNames: 1 },
  { file: "long-07-1.png", query: "?screen=07-1&long=1", expectNames: 3 },
];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

const all = [];
let failed = false;

for (const item of SCREENS) {
  await page.goto(`http://127.0.0.1:${PORT}/${item.query}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    (count) => document.querySelectorAll('.team-name[data-team-name-ready="true"]').length >= count,
    { timeout: 5000 },
    item.expectNames,
  );
  await new Promise((r) => setTimeout(r, 120));

  const measured = await page.evaluate(() => {
    const canvas = document.querySelector(".canvas");
    const scale = canvas ? canvas.getBoundingClientRect().width / 1920 : 1;

    const toLocal = (rect) => ({
      left: rect.left / scale,
      top: rect.top / scale,
      right: rect.right / scale,
      bottom: rect.bottom / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    });

    const overlaps = (a, b, slop = 0.5) =>
      a.left < b.right - slop && a.right > b.left + slop && a.top < b.bottom - slop && a.bottom > b.top + slop;

    const nodes = [...document.querySelectorAll(".team-name")];
    const names = nodes.map((el) => {
      const lines = [...el.querySelectorAll(".team-name-line")].map((line) => {
        const range = document.createRange();
        range.selectNodeContents(line);
        const rects = range.getClientRects();
        let width = 0;
        for (const rect of rects) width = Math.max(width, rect.width / scale);
        return { text: line.textContent ?? "", width };
      });
      const box = toLocal(el.getBoundingClientRect());
      const cell = el.offsetWidth;
      const overflowX = lines.some((line) => line.width > cell + 0.5);
      const textHeight = lines.length > 1 ? lines.length * 48 : box.height;
      const tight = lines.length > 1 && textHeight > el.offsetHeight + 0.5;
      return {
        text: lines.map((line) => line.text).join("|"),
        fontSize: Number(el.getAttribute("data-font-size")),
        lineCount: Number(el.getAttribute("data-lines")),
        cellWidth: cell,
        lineWidths: lines.map((line) => line.width),
        box,
        overflowX,
        tight,
        boxHeight: el.offsetHeight,
      };
    });

    const overlapPairs = [];
    for (let i = 0; i < names.length; i += 1) {
      for (let j = i + 1; j < names.length; j += 1) {
        if (overlaps(names[i].box, names[j].box)) overlapPairs.push([i, j]);
      }
    }

    return { names, overlapPairs };
  });

  const file = path.join(OUT, item.file);
  await page.screenshot({ path: file, type: "png" });

  const issues = [];
  if (measured.names.length < item.expectNames) {
    issues.push(`expected ${item.expectNames} names, got ${measured.names.length}`);
  }
  for (const name of measured.names) {
    if (name.overflowX) {
      issues.push(`horizontal overflow "${name.text}" lines=${name.lineWidths.join(",")} cell=${name.cellWidth}`);
    }
  }
  if (measured.overlapPairs.length) {
    issues.push(`overlapping name boxes: ${JSON.stringify(measured.overlapPairs)}`);
  }

  const tight = measured.names.filter((n) => n.tight);
  const summary = {
    file: item.file,
    query: item.query,
    issues,
    tight: tight.map((n) => ({
      text: n.text,
      fontSize: n.fontSize,
      lineCount: n.lineCount,
      textHeight: n.lineCount > 1 ? n.lineCount * 48 : n.boxHeight,
      boxHeight: n.boxHeight,
      cellWidth: n.cellWidth,
    })),
    names: measured.names.map((n) => ({
      text: n.text,
      fontSize: n.fontSize,
      lineCount: n.lineCount,
      cellWidth: n.cellWidth,
      lineWidths: n.lineWidths,
      box: {
        left: Math.round(n.box.left * 10) / 10,
        top: Math.round(n.box.top * 10) / 10,
        width: Math.round(n.box.width * 10) / 10,
        height: Math.round(n.box.height * 10) / 10,
      },
    })),
  };
  all.push(summary);
  console.log(JSON.stringify(summary, null, 2));
  if (issues.length) failed = true;
}

await browser.close();
if (failed) {
  throw new Error("team-name measurement found overlaps or overflow");
}
console.log("all team-name screens passed overlap checks");
