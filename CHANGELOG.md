# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] — Unreleased

### Initial Release

- `aggregateByScalarField(items, getField, options?)` — count items by
  a scalar field (`artist`, `author`, `source`). Returns
  `TaxonomyEntry[]` sorted by count desc then name asc.
- `aggregateByListField(items, getField, options?)` — count items by
  a list field (`tags`, `genres`). Per-item dedupe.
- `groupCollectionByScalarSlug(items, getField, options?)` — bucket
  items by scalar field, returning `Map<slug, { name, items }>`.
- `groupCollectionByListSlug(items, getField, options?)` — bucket
  items by list field. Per-item dedupe.
- `defaultSlugFn(value)` — kebab-case-only slugifier (no
  transliteration). Pass your own via the `slugFn` option to plug in
  e.g. `slugify` from `@arraypress/slug` for stronger normalisation.

Zero dependencies, ESM-only, works in Node / Cloudflare Workers /
Deno / Bun / browsers.
