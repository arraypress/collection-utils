/**
 * Adding things up: sums, counts, rankings of grouped rows, shares and
 * changes. The arithmetic behind a report's "top products", "orders by
 * country" and "+12.5% on last month".
 *
 * Like the rest of the package, inputs are any iterable.
 *
 * @module @arraypress/collection-utils/stats
 */

/**
 * Round to some decimal places.
 *
 * @param {number} value    The number.
 * @param {number} decimals Places to keep.
 * @returns {number} The rounded number.
 */
function roundTo(value, decimals) {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

/**
 * Add up a value across items.
 *
 * @template T
 * @param {Iterable<T>} items The items.
 * @param {(item: T) => number} valueOf What each item adds.
 * @returns {number} The sum (0 for no items).
 *
 * @example
 * sumBy(orders, (o) => o.amount) // 12900
 */
export function sumBy(items, valueOf) {
  let total = 0;
  for (const item of items) total += valueOf(item);
  return total;
}

/**
 * Count items by a key.
 *
 * @template T
 * @param {Iterable<T>} items The items.
 * @param {(item: T) => string | null | undefined} keyOf An item's key; null or undefined leaves it out.
 * @returns {Map<string, number>} Each key's count, in first-seen order.
 *
 * @example
 * countBy(orders, (o) => o.country) // Map { 'TH' => 12, 'GB' => 4 }
 */
export function countBy(items, keyOf) {
  const counts = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (key !== null && key !== undefined) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Group items by a key, count and total each group, and rank the groups:
 * biggest total first, then most items, then the order they first
 * appeared (the sort is stable).
 *
 * @template T
 * @param {Iterable<T>} items The items.
 * @param {(item: T) => string | null | undefined} keyOf An item's group; null or undefined leaves it out.
 * @param {(item: T) => number} valueOf What an item adds to its group's total.
 * @param {number} [limit] Groups to keep. Defaults to all.
 * @returns {{ name: string, count: number, total: number }[]} The groups, ranked.
 *
 * @example
 * rankBy(lines, (l) => l.product, (l) => l.amount, 5) // top 5 products by revenue
 */
export function rankBy(items, keyOf, valueOf, limit = Infinity) {
  const groups = new Map();
  for (const item of items) {
    const name = keyOf(item);
    if (name === null || name === undefined) continue;
    const group = groups.get(name) ?? { name, count: 0, total: 0 };
    group.count += 1;
    group.total += valueOf(item);
    groups.set(name, group);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total || b.count - a.count).slice(0, limit);
}

/**
 * A part as a share of a whole: a divide that doesn't produce `Infinity`
 * or `NaN`.
 *
 * @param {number} part  The part.
 * @param {number} whole The whole.
 * @param {number} [decimals] Places to round to. Defaults to 3.
 * @returns {number | null} The ratio (0.125), or null when the whole is zero.
 *
 * @example
 * ratio(3, 24) // 0.125 (a 12.5% conversion rate)
 */
export function ratio(part, whole, decimals = 3) {
  return whole === 0 ? null : roundTo(part / whole, decimals);
}

/**
 * The percent change from one value to another.
 *
 * @param {number} now    The new value.
 * @param {number} before The old value.
 * @param {number} [decimals] Places to round to. Defaults to 1.
 * @returns {number | null} e.g. `12.5` for +12.5%, or null when the old value was zero (no change can be expressed from nothing).
 *
 * @example
 * percentChange(1350, 1200) // 12.5
 */
export function percentChange(now, before, decimals = 1) {
  return before === 0 ? null : roundTo(((now - before) / before) * 100, decimals);
}
