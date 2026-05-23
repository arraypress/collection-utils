/**
 * @arraypress/collection-utils — TypeScript definitions.
 */

/** One row in a taxonomy index page — `aggregateByScalarField` /
 *  `aggregateByListField` return arrays of these. */
export interface TaxonomyEntry {
  /** Display name (preserves casing — first occurrence wins). */
  name: string;
  /** Slug used in `/route/[slug]` URLs. */
  slug: string;
  /** Number of items carrying this value. */
  count: number;
}

/** Per-slug bucket — `groupCollectionByScalarSlug` /
 *  `groupCollectionByListSlug` return `Map<string, GroupedBucket<T>>`. */
export interface GroupedBucket<T> {
  /** First-occurrence display name. */
  name: string;
  /** Items carrying this taxonomy value. */
  items: T[];
}

export interface AggregateOptions {
  /** Slugifier callback. Defaults to `defaultSlugFn` (kebab-case-only).
   *  Plug `slugify` from `@arraypress/slug` for transliteration. */
  slugFn?: (value: string) => string;
}

/** Default slug function — lowercase → trim → spaces to hyphens →
 *  strip anything non `[a-z0-9-]`. */
export function defaultSlugFn(value: string | undefined | null): string;

/**
 * Aggregate by a **scalar** field (`artist`, `author`, `source`).
 * Returns one entry per unique slug, sorted by count desc then name asc.
 */
export function aggregateByScalarField<T>(
  items: Iterable<T>,
  getField: (item: T) => string | undefined | null,
  options?: AggregateOptions,
): TaxonomyEntry[];

/**
 * Aggregate by a **list** field (`tags`, `genres`). Same return
 * shape. Per-item dedupe — duplicate values in a single item count
 * once.
 */
export function aggregateByListField<T>(
  items: Iterable<T>,
  getField: (item: T) => readonly string[] | undefined | null,
  options?: AggregateOptions,
): TaxonomyEntry[];

/**
 * Group by a **scalar** field, returning `Map<slug, { name, items }>`
 * — the shape `getStaticPaths()` needs.
 */
export function groupCollectionByScalarSlug<T>(
  items: Iterable<T>,
  getField: (item: T) => string | undefined | null,
  options?: AggregateOptions,
): Map<string, GroupedBucket<T>>;

/**
 * Group by a **list** field, returning `Map<slug, { name, items }>`.
 * Per-item dedupe.
 */
export function groupCollectionByListSlug<T>(
  items: Iterable<T>,
  getField: (item: T) => readonly string[] | undefined | null,
  options?: AggregateOptions,
): Map<string, GroupedBucket<T>>;
