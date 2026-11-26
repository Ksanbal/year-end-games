import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4182";
const OUT = process.env.OUT || "/workspace/year-end-games/screenshots-fixes-r3";
const STORAGE_KEY = "year-end-games:v1";

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
page.setDefaultTimeout(20000);

const failures = [];
const results = {};

function record(name, data) {
  results[name] = data;
  const bad = data.failures || [];
  if (bad.length) {
    failures.push(`${name}: ${bad.join("; ")}`);
  }
  console.log(JSON.stringify({ name, ...data }, null, 2));
}

function slotState({ coins, order, idx, outcomes, teams, lap = 0 }) {
  return {
    version: 1,
    state: {
      teams: teams || ["1팀", "2팀", "3팀"],
      coins,
      rounds: {},
      slotOrder: order,
      slotOutcomes: outcomes,
      phase: { kind: "slotTurn", orderIndex: idx, lap },
    },
  };
}

async function seedAndContinue(state) {
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await page.evaluate(
    ({ key, payload }) => {
      localStorage.clear();
      localStorage.setItem(key, JSON.stringify(payload));
    },
    { key: STORAGE_KEY, payload: state },
  );
  await page.reload({ waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const resume = await page.waitForFunction(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("이어서 진행"));
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!resume) throw new Error("resume button missing");
  await page.waitForFunction(() => document.body.innerText.includes("운명의 레버"));
  await new Promise((r) => setTimeout(r, 80));
}

async function bodyText() {
  return page.evaluate(() => document.body.innerText);
}

async function probeWrongShake(code, filePrefix) {
  await page.goto(`${BASE}/?screen=${encodeURIComponent(code)}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 150));

  const setup = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".word-card")];
    return {
      cardCount: cards.length,
      text: document.body.innerText,
    };
  });

  // Click the four cards left-to-right. If that happens to be correct, click
  // right-to-left on the next problem after the board resets, or force the
  // leftover used cards in reverse.
  const clickCards = async (reverse) => {
    await page.evaluate((rev) => {
      const cards = [...document.querySelectorAll(".word-card.is-ready")];
      const order = rev ? cards.reverse() : cards;
      for (const card of order) card.click();
    }, reverse);
  };

  await clickCards(false);
  let shaking = await page.evaluate(() => document.querySelector(".word-slots.is-shake") !== null);
  if (!shaking) {
    // Correct guess: wait for the next problem, then click in reverse.
    await page.waitForFunction(() => document.querySelectorAll(".word-card.is-ready").length >= 3, { timeout: 4000 }).catch(() => {});
    await clickCards(true);
    shaking = await page.evaluate(() => document.querySelector(".word-slots.is-shake") !== null);
  }
  const t0 = Date.now();
  if (!shaking) {
    record(`n1-${filePrefix}-no-shake`, { setup, failures: ["could not trigger a wrong-answer shake"] });
    return;
  }

  const samples = [];
  for (const delay of [0, 100, 250, 400]) {
    const elapsed = Date.now() - t0;
    const wait = delay - elapsed;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const sample = await page.evaluate(() => {
      const slots = [...document.querySelectorAll(".word-slot")];
      const hits = slots.map((slot) => {
        const r = slot.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const el = document.elementFromPoint(x, y);
        const cls = el ? el.className : null;
        const chain = [];
        let n = el;
        while (n && n !== document.body) {
          if (n.className) chain.push(String(n.className));
          n = n.parentElement;
        }
        return { cls, chain, x, y };
      });
      const slotsEl = document.querySelector(".word-slots");
      return {
        slotsCls: slotsEl ? slotsEl.className : null,
        transform: slotsEl ? getComputedStyle(slotsEl).transform : null,
        zIndex: slotsEl ? getComputedStyle(slotsEl).zIndex : null,
        position: slotsEl ? getComputedStyle(slotsEl).position : null,
        hits,
      };
    });
    const file = path.join(OUT, `${filePrefix}-d${delay}.png`);
    await page.screenshot({ path: file, type: "png" });
    const badHits = sample.hits.filter((h) => String(h.cls).includes("card-face") && !String(h.chain).includes("word-slot"));
    samples.push({ delay, file, ...sample, badHits: badHits.length });
  }

  const failed = samples.filter((s) => s.delay < 400 && s.badHits > 0);
  // 400ms may be mid-shake or after; slots must still not sit behind the panel while shaking.
  const behind = samples.filter((s) => s.badHits > 0);
  record(`n1-${filePrefix}`, {
    setup,
    samples: samples.map((s) => ({
      delay: s.delay,
      file: s.file,
      slotsCls: s.slotsCls,
      transform: s.transform,
      zIndex: s.zIndex,
      position: s.position,
      hits: s.hits.map((h) => h.cls),
      badHits: s.badHits,
    })),
    failures: behind.length ? behind.map((s) => `d${s.delay}: ${s.badHits} slot(s) behind card-face`) : [],
  });
}

async function probeAutoSkip() {
  // First team, 0 coins. Notice should appear, then advance without a tap.
  await seedAndContinue(slotState({ coins: [0, 120, 80], order: [0, 2, 1], idx: 0, outcomes: [null, null, null] }));
  const firstText = await bodyText();
  const firstFile = path.join(OUT, "zero-autoskip-first-notice.png");
  await page.screenshot({ path: firstFile, type: "png" });
  const firstFailures = [];
  if (!firstText.includes("돌리지 않고 넘어가요")) firstFailures.push("first: notice missing");
  if (!firstText.includes("다음 팀")) firstFailures.push("first: next-team label missing");
  if (firstText.includes("베팅하기")) firstFailures.push("first: betting UI shown");

  await new Promise((r) => setTimeout(r, 1500));
  const afterFirst = await bodyText();
  const afterFirstFile = path.join(OUT, "zero-autoskip-first-after.png");
  await page.screenshot({ path: afterFirstFile, type: "png" });
  if (afterFirst.includes("돌리지 않고 넘어가요")) firstFailures.push("first: still on notice after 1.5s");
  if (!afterFirst.includes("베팅") && !afterFirst.includes("베팅하기")) {
    // 3팀 has 80 coins and is next (order 0,2,1)
    firstFailures.push("first: did not reach the next team's turn");
  }
  record("zero-autoskip-first", {
    files: [firstFile, afterFirstFile],
    firstText,
    afterFirst,
    failures: firstFailures,
  });

  // Last team, 0 coins. Auto-advance should open the final result.
  await seedAndContinue(
    slotState({
      coins: [120, 0, 80],
      lap: 2,
      order: [2, 0, 1],
      idx: 2,
      outcomes: [{ kind: "skip" }, null, { kind: "skip" }],
    }),
  );
  const lastText = await bodyText();
  const lastFile = path.join(OUT, "zero-autoskip-last-notice.png");
  await page.screenshot({ path: lastFile, type: "png" });
  const lastFailures = [];
  if (!lastText.includes("돌리지 않고 넘어가요")) lastFailures.push("last: notice missing");
  if (!lastText.includes("최종 결과 공개")) lastFailures.push("last: reveal label missing");

  await new Promise((r) => setTimeout(r, 1500));
  const afterLast = await bodyText();
  const afterLastFile = path.join(OUT, "zero-autoskip-last-after.png");
  await page.screenshot({ path: afterLastFile, type: "png" });
  if (afterLast.includes("돌리지 않고 넘어가요")) lastFailures.push("last: still on notice after 1.5s");
  if (!afterLast.includes("최종 결과")) lastFailures.push("last: did not open the final result");
  record("zero-autoskip-last", {
    files: [lastFile, afterLastFile],
    lastText,
    afterLast,
    failures: lastFailures,
  });

  // Middle team, plus a tap during the timer must not double-advance past the next screen.
  await seedAndContinue(
    slotState({
      coins: [120, 0, 80],
      order: [0, 1, 2],
      idx: 1,
      outcomes: [{ kind: "skip" }, null, null],
    }),
  );
  const midText = await bodyText();
  const midFailures = [];
  if (!midText.includes("돌리지 않고 넘어가요")) midFailures.push("middle: notice missing");

  // Click the button early, then let the original timer window elapse.
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("다음 팀"));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 200));
  const afterClick = await bodyText();
  await new Promise((r) => setTimeout(r, 1500));
  const afterWait = await bodyText();
  const midFile = path.join(OUT, "zero-autoskip-middle-click.png");
  await page.screenshot({ path: midFile, type: "png" });
  if (afterClick.includes("돌리지 않고 넘어가요")) midFailures.push("middle: click did not advance");
  // Next team (index 2) should be betting, not already at the final screen.
  if (afterWait.includes("최종 1등") || afterWait.includes("최종 공동")) {
    midFailures.push("middle: timer plus click skipped past the next team");
  }
  if (!afterWait.includes("베팅") && !afterWait.includes("베팅하기")) {
    midFailures.push("middle: did not stay on the next team's turn");
  }
  record("zero-autoskip-middle-click", {
    file: midFile,
    midText,
    afterClick,
    afterWait,
    failures: midFailures,
  });
}

await probeWrongShake("04-1", "n1-g3-wrong");
await probeWrongShake("03-1", "n1-g2-wrong");
await probeAutoSkip();

await browser.close();

if (failures.length) {
  console.error("SMOKE FAILED\n" + failures.join("\n"));
  process.exit(1);
}
console.log("all r3 smoke checks passed");
