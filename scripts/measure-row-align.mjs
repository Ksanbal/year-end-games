import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4184";
const OUT = process.env.OUT || "/tmp/row-align-r4";
const TOL = Number(process.env.TOL || "3");

const SCREENS = [
  { file: "07-1-default.png", query: "?screen=07-1", expectNames: 3, kind: "turn" },
  { file: "07-1-long.png", query: "?screen=07-1&long=1", expectNames: 3, kind: "turn" },
  { file: "07-2-default.png", query: "?screen=07-2", expectNames: 3, kind: "turn" },
  { file: "07-2-long.png", query: "?screen=07-2&long=1", expectNames: 3, kind: "turn" },
  { file: "08-1-default.png", query: "?screen=08-1", expectNames: 3, kind: "result" },
  { file: "08-1-long.png", query: "?screen=08-1&long=1", expectNames: 3, kind: "result" },
  { file: "10-1-default.png", query: "?screen=10-1", expectNames: 3, kind: "result" },
  { file: "10-1-long.png", query: "?screen=10-1&long=1", expectNames: 3, kind: "result" },
  { file: "09-0-default.png", query: "?screen=09-0", expectNames: 3, kind: "result" },
  { file: "09-0-long.png", query: "?screen=09-0&long=1", expectNames: 3, kind: "result" },
  { file: "09-1-default.png", query: "?screen=09-1", expectNames: 1, kind: "header" },
  { file: "09-1-long.png", query: "?screen=09-1&long=1", expectNames: 1, kind: "header" },
];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

let failed = false;
const all = [];

for (const item of SCREENS) {
  await page.goto(`http://127.0.0.1:${PORT}/${item.query}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    (count) => document.querySelectorAll('.team-name[data-team-name-ready="true"]').length >= count,
    { timeout: 5000 },
    item.expectNames,
  );
  await new Promise((r) => setTimeout(r, 80));

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
      midY: (rect.top + rect.bottom) / 2 / scale,
    });

    return [...document.querySelectorAll(".team-name")].map((el) => {
      const box = toLocal(el.getBoundingClientRect());
      const linesEl = el.querySelector(".team-name-lines");
      const linesBox = linesEl ? toLocal(linesEl.getBoundingClientRect()) : null;
      const lineNodes = [...el.querySelectorAll(".team-name-line")];
      const firstLine = lineNodes[0] ? toLocal(lineNodes[0].getBoundingClientRect()) : null;
      const host = el.closest(".card-face") ?? el.parentElement;
      const neighbors = [...(host?.querySelectorAll("div") ?? [])].filter((node) => {
        if (node === el || el.contains(node) || node.contains(el)) return false;
        if (node.classList.contains("team-name") || node.querySelector(".team-name")) return false;
        const text = (node.textContent ?? "").trim();
        if (!text) return false;
        const r = toLocal(node.getBoundingClientRect());
        if (r.width > 900 || r.height > 80) return false;
        return r.top < box.bottom && r.bottom > box.top;
      });
      const left = neighbors
        .filter((node) => toLocal(node.getBoundingClientRect()).right <= box.left + 1)
        .sort((a, b) => toLocal(b.getBoundingClientRect()).left - toLocal(a.getBoundingClientRect()).left)[0];
      const right = neighbors
        .filter((node) => toLocal(node.getBoundingClientRect()).left >= box.right - 1)
        .sort((a, b) => toLocal(a.getBoundingClientRect()).left - toLocal(b.getBoundingClientRect()).left)[0];
      return {
        text: lineNodes.map((n) => n.textContent ?? "").join("|"),
        alignY: el.getAttribute("data-align-y"),
        lineCount: Number(el.getAttribute("data-lines")),
        box,
        linesBox,
        firstLine,
        label: left
          ? { text: (left.textContent ?? "").trim(), ...toLocal(left.getBoundingClientRect()) }
          : null,
        score: right
          ? { text: (right.textContent ?? "").trim().slice(0, 24), ...toLocal(right.getBoundingClientRect()) }
          : null,
      };
    });
  });

  const file = path.join(OUT, item.file);
  await page.screenshot({ path: file, type: "png" });

  const rows = [];
  const issues = [];
  for (const row of measured) {
    const blockMid = row.linesBox?.midY;
    const firstMid = row.firstLine?.midY;
    const nameMid = row.lineCount > 1 && item.kind === "turn" ? firstMid : blockMid;
    const labelMid = row.label?.midY;
    const scoreMid = row.score?.midY;
    const vsLabel = labelMid != null && nameMid != null ? nameMid - labelMid : null;
    const vsScore = scoreMid != null && nameMid != null ? nameMid - scoreMid : null;
    const entry = {
      text: row.text,
      lines: row.lineCount,
      alignY: row.alignY,
      nameMid: nameMid != null ? Number(nameMid.toFixed(1)) : null,
      blockMid: blockMid != null ? Number(blockMid.toFixed(1)) : null,
      firstMid: firstMid != null ? Number(firstMid.toFixed(1)) : null,
      label: row.label ? { text: row.label.text, midY: Number(row.label.midY.toFixed(1)) } : null,
      score: row.score ? { text: row.score.text, midY: Number(row.score.midY.toFixed(1)) } : null,
      vsLabel: vsLabel != null ? Number(vsLabel.toFixed(1)) : null,
      vsScore: vsScore != null ? Number(vsScore.toFixed(1)) : null,
    };
    rows.push(entry);
    if (item.kind !== "header" && (vsLabel == null || vsScore == null)) {
      issues.push(`missing neighbor for "${row.text}"`);
    }
    if (vsLabel != null && Math.abs(vsLabel) > TOL) {
      issues.push(`"${row.text}" vs label ${vsLabel.toFixed(1)}px`);
    }
    if (vsScore != null && Math.abs(vsScore) > TOL) {
      issues.push(`"${row.text}" vs score ${vsScore.toFixed(1)}px`);
    }
  }
  if (measured.length < item.expectNames) issues.push(`expected ${item.expectNames} names, got ${measured.length}`);
  if (issues.length) failed = true;
  all.push({ file: item.file, query: item.query, issues, rows });
  console.log(`${issues.length ? "FAIL" : "ok  "} ${item.file}`);
  for (const row of rows) {
    console.log(
      `     ${row.text} lines=${row.lines} alignY=${row.alignY} name=${row.nameMid} label=${row.label?.midY ?? "-"}(${row.label?.text ?? ""}) score=${row.score?.midY ?? "-"}(${row.score?.text ?? ""}) dLabel=${row.vsLabel} dScore=${row.vsScore}`,
    );
  }
  for (const issue of issues) console.log(`     ! ${issue}`);
}

await browser.close();
console.log(JSON.stringify(all, null, 2));
if (failed) {
  console.error("row alignment check failed");
  process.exit(1);
}
