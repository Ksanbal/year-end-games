import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = process.env.PORT || "4173";
const OUT = path.resolve("screenshots/foundation");
const SCREENS = [
  "00-0", "00-1", "00-2",
  "01-0", "01-1", "01-2", "01-3",
  "03-0", "04-0", "05-i", "06-i",
  "07-1", "07-2",
  "08-1", "08-2",
  "09-0",
  "10-1", "10-2",
  "11-1",
];

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
  if (code === "01-1") {
    await new Promise((r) => setTimeout(r, 400));
  } else {
    await new Promise((r) => setTimeout(r, 150));
  }
  const file = path.join(OUT, `${code}.png`);
  await page.screenshot({ path: file, type: "png" });
  console.log("wrote", file);
}

await browser.close();
