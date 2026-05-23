/**
 * @arraypress/collection-utils
 *
 * Aggregate + group collections by scalar or list taxonomy fields.
 * The primitives behind every "/tags", "/genres", "/artists",
 * "/authors", "/news/sources" archive page in an Astro theme — and
 * any other surface that needs faceted counts or per-facet item
 * buckets.
 *
 * Zero dependencies. Works in Node.js, Cloudflare Workers, Deno,
 * Bun, and browsers. The collection input is generic: anything
 * iterable will do. The default slug function is kebab-case-only
 * (no transliteration); pass `slugFn` to plug in
 * `@arraypress/slug`'s `slugify` for stronger normalisation.
 *
 * @module @arraypress/collection-utils
 */

/**
 * Default slug function — lowercase → trim → spaces to hyphens →
 * strip anything non `[a-z0-9-]`. Plenty for ASCII taxonomy values.
 * Pass your own `slugFn` (e.g. `slugify` from `@arraypress/slug`)
 * if you need transliteration or stop-word handling.
 *
 * @param {string | undefined | null} value
 * @returns {string}
 */
export function defaultSlugFn(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * @typedef {Object} TaxonomyEntry
 * @property {string} name - Display name (first-occurrence wins for casing).
 * @property {string} slug - URL-safe slug.
 * @property {number} count - Number of items carrying this value.
 */

/**
 * @typedef {Object} AggregateOptions
 * @property {(value: string) => string} [slugFn] - Slugifier callback. Defaults to `defaultSlugFn`.
 */

/**
 * Aggregate a collection by a **scalar** taxonomy field (`artist`,
 * `author`, `source` — fields where each item carries exactly one
 * value).
 *
 * Returns one entry per unique slug, sorted by count desc then
 * name asc. Items where `getField` returns null/empty are skipped.
 *
 * First-occurrence wins the display name when slug-equal values
 * exist with different casing — defensive against inconsistent
 * frontmatter ("David Sherlock" vs "david sherlock" both bucket
 * under `david-sherlock` and the first one seen sets the casing).
 *
 * @template T
 * @param {Iterable<T>} items
 * @param {(item: T) => string | undefined | null} getField
 * @param {AggregateOptions} [options]
 * @returns {TaxonomyEntry[]}
 *
 * @example
 * const posts = await getCollection('posts');
 * aggregateByScalarField(posts, p => p.data.author);
 * // → [{ name: 'David Sherlock', slug: 'david-sherlock', count: 12 }, ...]
 */
export function aggregateByScalarField(items, getField, options = {}) {
  const slugFn = options.slugFn ?? defaultSlugFn;
  const bySlug = new Map();
  for (const item of items) {
    const raw = getField(item);
    const name = typeof raw === 'string' ? raw.trim() : '';
    if (!name) continue;
    const slug = slugFn(name);
    if (!slug) continue;
    const existing = bySlug.get(slug);
    if (existing) {
      existing.count++;
    } else {
      bySlug.set(slug, { name, slug, count: 1 });
    }
  }
  return Array.from(bySlug.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

/**
 * Aggregate a collection by a **list** taxonomy field (`tags`,
 * `genres` — fields where each item carries an array of values).
 *
 * Same return shape as `aggregateByScalarField`. Per-item dedupe:
 * an item that lists the same value twice (`tags: ['trance',
 * 'trance']`) only counts once toward the total.
 *
 * @template T
 * @param {Iterable<T>} items
 * @param {(item: T) => readonly string[] | undefined | null} getField
 * @param {AggregateOptions} [options]
 * @returns {TaxonomyEntry[]}
 *
 * @example
 * const products = await getCollection('products');
 * aggregateByListField(products, p => p.data.genres);
 * // → [{ name: 'trance', slug: 'trance', count: 18 }, ...]
 */
export function aggregateByListField(items, getField, options = {}) {
  const slugFn = options.slugFn ?? defaultSlugFn;
  const bySlug = new Map();
  for (const item of items) {
    const list = getField(item);
    if (!list || list.length === 0) continue;
    const seen = new Set();
    for (const raw of list) {
      const name = typeof raw === 'string' ? raw.trim() : '';
      if (!name) continue;
      const slug = slugFn(name);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const existing = bySlug.get(slug);
      if (existing) {
        existing.count++;
      } else {
        bySlug.set(slug, { name, slug, count: 1 });
      }
    }
  }
  return Array.from(bySlug.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

/**
 * @template T
 * @typedef {Object} GroupedBucket
 * @property {string} name - First-occurrence display name.
 * @property {T[]} items - Items carrying this taxonomy value.
 */

/**
 * Group a collection by a **scalar** taxonomy field, returning the
 * full item bucket per slug — the shape `getStaticPaths()` needs
 * to generate `/route/[slug]` detail pages.
 *
 * First-occurrence wins the display name (mirrors
 * `aggregateByScalarField`).
 *
 * @template T
 * @param {Iterable<T>} items
 * @param {(item: T) => string | undefined | null} getField
 * @param {AggregateOptions} [options]
 * @returns {Map<string, GroupedBucket<T>>}
 *
 * @example
 * const all = await getCollection('products');
 * const grouped = groupCollectionByScalarSlug(all, p => p.data.artist);
 * return Array.from(grouped.entries()).map(([slug, { name, items }]) => ({
 *   params: { slug },
 *   props:  { name, products: sortProducts(items) },
 * }));
 */
export function groupCollectionByScalarSlug(items, getField, options = {}) {
  const slugFn = options.slugFn ?? defaultSlugFn;
  const bySlug = new Map();
  for (const item of items) {
    const raw = getField(item);
    const name = typeof raw === 'string' ? raw.trim() : '';
    if (!name) continue;
    const slug = slugFn(name);
    if (!slug) continue;
    const existing = bySlug.get(slug);
    if (existing) {
      existing.items.push(item);
    } else {
      bySlug.set(slug, { name, items: [item] });
    }
  }
  return bySlug;
}

/**
 * Group a collection by a **list** taxonomy field (`tags`,
 * `genres`), returning the full item bucket per slug. Used by
 * `/tags/[slug]`, `/genres/[slug]` etc. to enumerate every item
 * carrying each value.
 *
 * Per-item dedupe: an item with the same value twice (`tags:
 * ['trance', 'trance']`) only ends up in the bucket once.
 *
 * @template T
 * @param {Iterable<T>} items
 * @param {(item: T) => readonly string[] | undefined | null} getField
 * @param {AggregateOptions} [options]
 * @returns {Map<string, GroupedBucket<T>>}
 */
export function groupCollectionByListSlug(items, getField, options = {}) {
  const slugFn = options.slugFn ?? defaultSlugFn;
  const bySlug = new Map();
  for (const item of items) {
    const list = getField(item);
    if (!list || list.length === 0) continue;
    const seenForItem = new Set();
    for (const raw of list) {
      const name = typeof raw === 'string' ? raw.trim() : '';
      if (!name) continue;
      const slug = slugFn(name);
      if (!slug || seenForItem.has(slug)) continue;
      seenForItem.add(slug);
      const existing = bySlug.get(slug);
      if (existing) {
        existing.items.push(item);
      } else {
        bySlug.set(slug, { name, items: [item] });
      }
    }
  }
  return bySlug;
}
