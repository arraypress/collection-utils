/**
 * Splitting a list into pieces: batches for an API that takes a few at
 * a time, rows of a grid, pages of a long list.
 *
 * @module @arraypress/collection-utils/chunk
 */

/**
 * A list in pieces of at most `size`, in order. Every piece is full but
 * the last, which holds what's left.
 *
 * @template T
 * @param {readonly T[]} items The list.
 * @param {number} size Most items in a piece: a positive integer.
 * @returns {T[][]} The pieces ([] for an empty list).
 * @throws {RangeError} When `size` isn't a positive integer.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
export function chunk(items, size) {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`chunk size must be a positive integer, got ${size}`);
  }
  const pieces = [];
  for (let i = 0; i < items.length; i += size) pieces.push(items.slice(i, i + size));
  return pieces;
}
