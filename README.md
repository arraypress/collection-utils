# @arraypress/collection-utils

> Aggregate + group collections by scalar or list taxonomy fields.
> The primitives behind taxonomy archive pages — tag clouds, artist
> indexes, author lists, `/tags/[slug]` and friends.

Zero dependencies. ESM-only. Works in Node.js, Cloudflare Workers,
Deno, Bun, and browsers. Generic over any iterable input — designed
to fit Astro `CollectionEntry`-shaped objects but happy with anything.

## Install

```bash
npm install @arraypress/collection-utils
```

## Quick start

```js
import {
  aggregateByScalarField,
  aggregateByListField,
  groupCollectionByScalarSlug,
  groupCollectionByListSlug,
} from '@arraypress/collection-utils';

const posts = await getCollection('posts');

// Tag-cloud row: { name, slug, count } per unique tag.
const tagCloud = aggregateByListField(posts, p => p.data.tags);
// → [{ name: 'trance', slug: 'trance', count: 18 }, ...]

// Author index row: same shape, scalar field.
const authors = aggregateByScalarField(posts, p => p.data.author);
// → [{ name: 'David Sherlock', slug: 'david-sherlock', count: 12 }, ...]

// `/authors/[slug]` getStaticPaths — full item bucket per slug.
const grouped = groupCollectionByScalarSlug(posts, p => p.data.author);
return Array.from(grouped.entries()).map(([slug, { name, items }]) => ({
  params: { slug },
  props:  { name, posts: items.sort(byDateDesc) },
}));
```

## API

### `aggregateByScalarField(items, getField, options?)`

Returns `TaxonomyEntry[]` — one row per unique slug, sorted by
count desc then name asc. Skips items where `getField` returns
null/empty/whitespace.

```js
aggregateByScalarField(posts, p => p.data.author);
// → [{ name: 'David Sherlock', slug: 'david-sherlock', count: 12 }, ...]
```

**First-occurrence wins the display name** when slug-equal values
have different casing — `"David Sherlock"` and `"david sherlock"`
bucket under `david-sherlock` with the first-seen casing.

### `aggregateByListField(items, getField, options?)`

Same return shape — for list fields like `tags` / `genres`.

```js
aggregateByListField(posts, p => p.data.tags);
// → [{ name: 'trance', slug: 'trance', count: 18 }, ...]
```

**Per-item dedupe** — an item with `tags: ['trance', 'trance']`
counts once toward the total.

### `groupCollectionByScalarSlug(items, getField, options?)`

Returns `Map<slug, { name, items }>` — the bucket shape Astro's
`getStaticPaths()` needs to generate `/route/[slug]` detail pages.

```js
const grouped = groupCollectionByScalarSlug(posts, p => p.data.author);
return Array.from(grouped.entries()).map(([slug, { name, items }]) => ({
  params: { slug },
  props:  { name, posts: items.sort(byDateDesc) },
}));
```

### `groupCollectionByListSlug(items, getField, options?)`

Same as `groupCollectionByScalarSlug` but for list fields. Per-item
dedupe — a post with `tags: ['trance', 'trance']` only appears
once in the `trance` bucket.

### `defaultSlugFn(value)`

Kebab-case-only — lowercase, trim, spaces to hyphens, strip non
`[a-z0-9-]`. Used by every aggregator unless `options.slugFn` is
passed.

```js
defaultSlugFn('David Sherlock'); // → 'david-sherlock'
defaultSlugFn('138bpm');         // → '138bpm'
defaultSlugFn(undefined);        // → ''
```

For ASCII inputs this is plenty. For accented / non-Latin inputs,
plug in `slugify` from [`@arraypress/slug`](https://github.com/arraypress/slug):

```js
import { slugify } from '@arraypress/slug';

aggregateByScalarField(items, i => i.name, { slugFn: slugify });
// → 'Crème Brûlée' → 'creme-brulee'
```

### Report arithmetic

The sums and rankings behind "top products", "orders by country" and
"+12.5% on last month". Inputs are any iterable.

```js
import { sumBy, countBy, rankBy, ratio, percentChange } from '@arraypress/collection-utils';

sumBy(orders, (o) => o.amount);                              // 18000
countBy(orders, (o) => o.country);                           // Map { 'TH' => 2, 'GB' => 1 } (null keys left out)
rankBy(lines, (l) => l.product, (l) => l.amount, 5);         // [{ name, count, total }, …] biggest total first
ratio(3, 24);                                                // 0.125 (null when the whole is 0)
percentChange(1350, 1200);                                   // 12.5 (null when the old value is 0)
```

`rankBy` orders by total, then count, then the order groups first
appeared, so ties don't shuffle between runs.

### `chunk(items, size)`

A list in pieces of at most `size`, in order — batches for an API that
takes a few at a time, rows of a grid. Every piece is full but the last.

```js
import { chunk } from '@arraypress/collection-utils';

chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
chunk([], 3);              // []
chunk([1, 2], 0);          // throws a RangeError (size must be a positive integer)
```

## TypeScript

Ships with `.d.ts`. Generic over the item type:

```ts
import type { CollectionEntry } from 'astro:content';
import { aggregateByScalarField, type TaxonomyEntry } from '@arraypress/collection-utils';

const posts: CollectionEntry<'posts'>[] = await getCollection('posts');
const authors: TaxonomyEntry[] = aggregateByScalarField(
  posts,
  p => p.data.author,
);
```

## Why this exists

Every theme that ships taxonomy archives ends up writing variations
of the same four functions. This package gives you the canonical
implementation — first-occurrence-wins display names, per-item
dedupe, stable sort, defensive against null/empty values.

## License

MIT
