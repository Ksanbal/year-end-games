import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4173";
const OUT = path.resolve("screenshots/games");
const SCREENS = [
  "02-1", "02-2", "02-3",
  "03-1", "03-2", "03-3", "03-4",
  "04-1", "04-2", "04-3", "04-4",
  "05-0", "05-1", "05-2", "05-3",
  "06-1", "06-2", "06-3",
];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

for (const code of SCREENS) {
  const url = `http://127.0.0.1:${PORT}/?screen=${encodeURIComponent(code)}`;
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 150));
  const file = path.join(OUT, `${code}.png`);
  await page.screenshot({ path: file, type: "png" });
  console.log("wrote", file);
}

await browser.close();
