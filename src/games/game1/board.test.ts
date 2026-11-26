import { describe, expect, it } from "vitest";
import {
  MINE_COUNT,
  SAFE_COUNT,
  SIZE,
  allSafeOpened,
  boardFromMines,
  cellIndex,
  createBoard,
  neighbors,
  openMany,
  openedScore,
  placeMines,
  reveal,
} from "./board.ts";

/** Mines from the 02-2 frame, row-major: (3,0), (1,1), (4,2), (0,3), (2,4). */
const FIGMA_MINES = [3, 6, 14, 15, 22];
const FIGMA_OPEN = [
  cellIndex(0, 0),
  cellIndex(4, 0),
  cellIndex(3, 1),
  cellIndex(2, 2),
  cellIndex(2, 3),
  cellIndex(4, 3),
  cellIndex(4, 4),
];

describe("placeMines", () => {
  it("places exactly 2 unique cells on a 5x5 board", () => {
    expect(MINE_COUNT).toBe(2);
    expect(SAFE_COUNT).toBe(23);
    const mines = placeMines(() => 0.3);
    expect(mines).toHaveLength(MINE_COUNT);
    expect(new Set(mines).size).toBe(MINE_COUNT);
    expect(mines.every((i) => i >= 0 && i < SIZE * SIZE)).toBe(true);
  });

  it("can put a mine on the first cell, so the first tap can hit", () => {
    const hit = reveal(boardFromMines([0, 1, 2, 3, 4]), 0);
    expect(hit.hitMine).toBe(true);
    expect(hit.score).toBe(0);
  });
});

describe("createBoard", () => {
  it("fills adjacent counts and leaves every cell closed", () => {
    const board = createBoard(() => 0.2);
    expect(board).toHaveLength(SIZE * SIZE);
    expect(board.filter((c) => c.mine)).toHaveLength(MINE_COUNT);
    expect(board.every((c) => !c.opened)).toBe(true);
    const mineAt = new Set(board.flatMap((c, i) => (c.mine ? [i] : [])));
    for (let i = 0; i < board.length; i++) {
      if (board[i]!.mine) continue;
      expect(board[i]!.adjacent).toBe(neighbors(i).filter((j) => mineAt.has(j)).length);
    }
  });
});

describe("reveal", () => {
  it("opens one safe cell and awards 1 point, without expanding zeros", () => {
    const board = boardFromMines(FIGMA_MINES);
    const zero = cellIndex(4, 4);
    expect(board[zero]!.adjacent).toBe(0);
    const first = reveal(board, zero);
    expect(first.hitMine).toBe(false);
    expect(first.score).toBe(1);
    expect(first.board.filter((c) => c.opened)).toHaveLength(1);
    expect(first.cleared).toBe(false);
  });

  it("ignores a second tap on the same cell", () => {
    const once = reveal(boardFromMines(FIGMA_MINES), cellIndex(0, 0));
    const twice = reveal(once.board, cellIndex(0, 0));
    expect(twice.score).toBe(1);
    expect(twice.board.filter((c) => c.opened)).toHaveLength(1);
  });

  it("ends the turn on a mine and reveals every mine, scoring only safe cells", () => {
    const mid = openMany(boardFromMines(FIGMA_MINES), FIGMA_OPEN);
    expect(openedScore(mid)).toBe(7);
    const boom = reveal(mid, cellIndex(2, 4));
    expect(boom.hitMine).toBe(true);
    expect(boom.score).toBe(7);
    expect(boom.board.filter((c) => c.mine).every((c) => c.opened)).toBe(true);
    expect(boom.cleared).toBe(false);
  });

  it("marks a fixture board cleared when every safe tile on that board is open", () => {
    const mines = new Set(FIGMA_MINES);
    const safe = Array.from({ length: 25 }, (_, i) => i).filter((i) => !mines.has(i));
    expect(safe).toHaveLength(20);
    const opened = openMany(boardFromMines(FIGMA_MINES), safe);
    expect(openedScore(opened)).toBe(20);
    expect(allSafeOpened(opened)).toBe(true);
    const last = safe[safe.length - 1]!;
    const almost = openMany(boardFromMines(FIGMA_MINES), safe.slice(0, -1));
    const done = reveal(almost, last);
    expect(done.cleared).toBe(true);
    expect(done.hitMine).toBe(false);
    expect(done.score).toBe(20);
  });

  it("marks a live board cleared after 23 safe tiles, with two mines left closed", () => {
    const liveMines = [0, 1];
    const safe = Array.from({ length: 25 }, (_, i) => i).filter((i) => !liveMines.includes(i));
    expect(safe).toHaveLength(SAFE_COUNT);
    const last = safe[safe.length - 1]!;
    const almost = openMany(boardFromMines(liveMines), safe.slice(0, -1));
    const done = reveal(almost, last);
    expect(done.cleared).toBe(true);
    expect(done.hitMine).toBe(false);
    expect(done.score).toBe(23);
    expect(done.board.filter((c) => c.mine && !c.opened)).toHaveLength(2);
  });

  it("computes adjacent mine counts for the fixture layout", () => {
    const board = boardFromMines(FIGMA_MINES);
    expect(board[cellIndex(0, 0)]!.adjacent).toBe(1);
    expect(board[cellIndex(4, 0)]!.adjacent).toBe(1);
    expect(board[cellIndex(3, 1)]!.adjacent).toBe(2);
    expect(board[cellIndex(2, 2)]!.adjacent).toBe(1);
    expect(board[cellIndex(2, 3)]!.adjacent).toBe(1);
    expect(board[cellIndex(4, 3)]!.adjacent).toBe(1);
    expect(board[cellIndex(4, 4)]!.adjacent).toBe(0);
  });
});
