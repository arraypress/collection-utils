/** A list in pieces of at most `size`, in order; [] for an empty list. Throws a RangeError unless `size` is a positive integer. */
export function chunk<T>(items: readonly T[], size: number): T[][];
