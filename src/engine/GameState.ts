import type { FlagCondition } from "./types";

/**
 * Story flags. Module-level so they survive scene restarts (map
 * transitions). Persistence to localStorage comes with save/load.
 */
const flags = new Set<string>();

export const GameState = {
  has(flag: string): boolean {
    return flags.has(flag);
  },
  set(flag: string): void {
    flags.add(flag);
  },
  setAll(list: string[] | undefined): void {
    for (const f of list ?? []) flags.add(f);
  },
  check(cond: FlagCondition): boolean {
    const need = cond.if ?? [];
    const block = cond.unless ?? [];
    return need.every((f) => flags.has(f)) && !block.some((f) => flags.has(f));
  },
};
