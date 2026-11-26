export const SIZE = 5;
export const MINE_COUNT = 5;
export const SAFE_COUNT = SIZE * SIZE - MINE_COUNT;

export type Cell = {
  mine: boolean;
  opened: boolean;
  adjacent: number;
};

export type Board = Cell[];

export function cellIndex(col: number, row: number): number {
  return row * SIZE + col;
}

export function neighbors(i: number): number[] {
  const col = i % SIZE;
  const row = Math.floor(i / SIZE);
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nextCol = col + dc;
      const nextRow = row + dr;
      if (nextCol >= 0 && nextCol < SIZE && nextRow >= 0 && nextRow < SIZE) {
        out.push(cellIndex(nextCol, nextRow));
      }
    }
  }
  return out;
}

export function boardFromMines(mines: readonly number[]): Board {
  const set = new Set(mines);
  return Array.from({ length: SIZE * SIZE }, (_, i) => ({
    mine: set.has(i),
    opened: false,
    adjacent: set.has(i) ? 0 : neighbors(i).reduce((count, j) => count + (set.has(j) ? 1 : 0), 0),
  }));
}

export function placeMines(random: () => number = Math.random): number[] {
  const spots = Array.from({ length: SIZE * SIZE }, (_, i) => i);
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = spots[i]!;
    spots[i] = spots[j]!;
    spots[j] = swap;
  }
  return spots.slice(0, MINE_COUNT).sort((a, b) => a - b);
}

export function createBoard(random: () => number = Math.random): Board {
  return boardFromMines(placeMines(random));
}

export function openedScore(board: Board): number {
  return board.reduce((score, cell) => score + (cell.opened && !cell.mine ? 1 : 0), 0);
}

export function allSafeOpened(board: Board): boolean {
  return openedScore(board) === SAFE_COUNT;
}

export type RevealResult = {
  board: Board;
  hitMine: boolean;
  cleared: boolean;
  score: number;
};

export function reveal(board: Board, at: number): RevealResult {
  const cell = board[at];
  if (!cell || cell.opened) {
    return { board, hitMine: false, cleared: allSafeOpened(board), score: openedScore(board) };
  }
  if (cell.mine) {
    const next = board.map((c) => (c.mine ? { ...c, opened: true } : c));
    return { board: next, hitMine: true, cleared: false, score: openedScore(next) };
  }
  const next = board.map((c, i) => (i === at ? { ...c, opened: true } : c));
  const score = openedScore(next);
  return { board: next, hitMine: false, cleared: score === SAFE_COUNT, score };
}

export function openMany(board: Board, cells: readonly number[]): Board {
  const set = new Set(cells);
  return board.map((cell, i) => (set.has(i) && !cell.mine ? { ...cell, opened: true } : cell));
}
