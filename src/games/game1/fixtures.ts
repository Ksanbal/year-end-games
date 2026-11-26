import { boardFromMines, cellIndex, openMany, type Board } from "./board.ts";

/** Mines from the 02-2 / 02-3 frames. */
export const FIGMA_MINES = [3, 6, 14, 15, 22] as const;

export const FIGMA_OPEN = [
  cellIndex(0, 0),
  cellIndex(4, 0),
  cellIndex(3, 1),
  cellIndex(2, 2),
  cellIndex(2, 3),
  cellIndex(4, 3),
  cellIndex(4, 4),
] as const;

export const FIGMA_EXPLODED_AT = cellIndex(2, 4);

export function fixtureBoard(code: string | null): { board: Board; explodedAt: number | null; ended: "mine" | "cleared" | null } | null {
  if (code === "02-1") {
    return { board: openMany(boardFromMines(FIGMA_MINES), FIGMA_OPEN), explodedAt: null, ended: null };
  }
  if (code === "02-2") {
    const opened = openMany(boardFromMines(FIGMA_MINES), FIGMA_OPEN);
    const board = opened.map((cell) => (cell.mine ? { ...cell, opened: true } : cell));
    return { board, explodedAt: FIGMA_EXPLODED_AT, ended: "mine" };
  }
  if (code === "02-3") {
    const mines = new Set<number>(FIGMA_MINES);
    const safe = Array.from({ length: 25 }, (_, i) => i).filter((i) => !mines.has(i));
    return { board: openMany(boardFromMines(FIGMA_MINES), safe), explodedAt: null, ended: "cleared" };
  }
  return null;
}

export function screenCode(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("screen");
}
