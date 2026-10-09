/** A group in a ranking: its name, how many items fell in it, and their total. */
export interface Ranked {
  name: string;
  count: number;
  total: number;
}

/** Add up a value across items (0 for none). */
export function sumBy<T>(items: Iterable<T>, valueOf: (item: T) => number): number;

/** Count items by a key; null or undefined keys are left out. */
export function countBy<T>(items: Iterable<T>, keyOf: (item: T) => string | null | undefined): Map<string, number>;

/** Group, count and total, ranked by total, then count, then first seen. */
export function rankBy<T>(items: Iterable<T>, keyOf: (item: T) => string | null | undefined, valueOf: (item: T) => number, limit?: number): Ranked[];

/** A part as a share of a whole; null when the whole is zero. */
export function ratio(part: number, whole: number, decimals?: number): number | null;

/** The percent change from `before` to `now`; null when `before` is zero. */
export function percentChange(now: number, before: number, decimals?: number): number | null;
