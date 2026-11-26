export const TIME_LIMIT_MS = 60_000;
export const MAX_QUESTIONS = 20;

export type WordProblem = {
  answer: string;
  meaning?: string;
};

export function syllables(answer: string): string[] {
  return Array.from(answer);
}

export function shuffleInPlace<T>(items: T[], random: () => number = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = items[i]!;
    items[i] = items[j]!;
    items[j] = swap;
  }
  return items;
}

export function dealCards(answer: string, random: () => number = Math.random): string[] {
  return shuffleInPlace(syllables(answer), random);
}

export function isCorrect(filled: readonly (string | null)[], answer: string): boolean {
  const expected = syllables(answer);
  if (filled.length !== expected.length) return false;
  return filled.every((glyph, i) => glyph === expected[i]);
}

export function formatRemain(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function remainLabel(ms: number): string {
  return `남은 시간 ${formatRemain(ms)}`;
}

export function pickProblem<T extends WordProblem>(
  pool: readonly T[],
  usedAnswers: ReadonlySet<string>,
  random: () => number = Math.random,
): T | null {
  const available = pool.filter((item) => !usedAnswers.has(item.answer));
  if (available.length === 0) return null;
  const index = Math.floor(random() * available.length);
  return available[index] ?? null;
}

const USED_KEY = "year-end-games:word-used:v1";

type UsedMap = { 2: string[]; 3: string[] };

function emptyUsed(): UsedMap {
  return { 2: [], 3: [] };
}

export function readUsedAnswers(game: 2 | 3): string[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(USED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<UsedMap>;
    return Array.isArray(parsed[game]) ? parsed[game] : [];
  } catch {
    return [];
  }
}

export function recordUsedAnswers(game: 2 | 3, answers: readonly string[]): void {
  if (typeof sessionStorage === "undefined") return;
  const next = emptyUsed();
  try {
    const raw = sessionStorage.getItem(USED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UsedMap>;
      next[2] = Array.isArray(parsed[2]) ? parsed[2] : [];
      next[3] = Array.isArray(parsed[3]) ? parsed[3] : [];
    }
  } catch {
    /* start clean */
  }
  const merged = new Set([...next[game], ...answers]);
  next[game] = [...merged];
  sessionStorage.setItem(USED_KEY, JSON.stringify(next));
}

export function clearUsedAnswers(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(USED_KEY);
}
