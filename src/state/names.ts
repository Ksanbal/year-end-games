
import { MAX_NAME_LENGTH } from "../games/catalog.ts";
import type { TeamIndex } from "./types.ts";

export function codePointLength(value: string): number {
  return Array.from(value).length;
}

export function clampName(raw: string): string {
  return Array.from(raw).slice(0, MAX_NAME_LENGTH).join("");
}

export function nameReady(names: readonly [string, string, string]): boolean {
  return names.every((name) => name.length > 0) && duplicateIndexes(names).size === 0;
}

/** Later occurrences of a repeated name (the first stay clean, matching 00-2). */
export function duplicateIndexes(names: readonly [string, string, string]): Set<TeamIndex> {
  const seen = new Map<string, TeamIndex>();
  const dups = new Set<TeamIndex>();
  names.forEach((name, i) => {
    if (name.length === 0) return;
    const prev = seen.get(name);
    if (prev !== undefined) {
      dups.add(i as TeamIndex);
    } else {
      seen.set(name, i as TeamIndex);
    }
  });
  return dups;
}
