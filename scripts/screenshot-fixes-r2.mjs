import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4180";
const OUT = process.env.OUT || "/workspace/year-end-games/screenshots-fixes-r2";
const SCREENS = ["09-7", "10-3", "10-1"];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

for (const code of SCREENS) {
  const url = `http://127.0.0.1:${PORT}/?screen=${encodeURIComponent(code)}`;
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 200));
  const file = path.join(OUT, `${code}.png`);
  await page.screenshot({ path: file, type: "png" });
  console.log("wrote", file);
}

await browser.close();
