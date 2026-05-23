import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultSlugFn,
  aggregateByScalarField,
  aggregateByListField,
  groupCollectionByScalarSlug,
  groupCollectionByListSlug,
} from '../src/index.js';

// Mimics an Astro CollectionEntry — a `data` bag on each item.
const posts = [
  { data: { title: 'A', author: 'David Sherlock', tags: ['trance', 'house'] } },
  { data: { title: 'B', author: 'David Sherlock', tags: ['trance'] } },
  { data: { title: 'C', author: 'Sean Tyas',      tags: ['trance', 'progressive'] } },
  { data: { title: 'D', author: '',               tags: ['house'] } },
  { data: { title: 'E', author: '  ',             tags: [] } },
  { data: { title: 'F', author: 'Sean Tyas',      tags: ['trance', 'trance'] } }, // dupe tag
];

// ── defaultSlugFn ───────────────────────────

describe('defaultSlugFn', () => {
  it('basic kebab-case', () => {
    assert.equal(defaultSlugFn('David Sherlock'), 'david-sherlock');
  });
  it('strips ampersands', () => {
    assert.equal(defaultSlugFn('Rock & Roll'), 'rock--roll');
  });
  it('preserves digits', () => {
    assert.equal(defaultSlugFn('138bpm'), '138bpm');
  });
  it('null/undefined → empty', () => {
    assert.equal(defaultSlugFn(null), '');
    assert.equal(defaultSlugFn(undefined), '');
    assert.equal(defaultSlugFn(''), '');
  });
  it('whitespace-only → empty', () => {
    assert.equal(defaultSlugFn('   '), '');
  });
  it('preserves leading/trailing hyphens after strip', () => {
    assert.equal(defaultSlugFn('hello-world'), 'hello-world');
  });
});

// ── aggregateByScalarField ──────────────────

describe('aggregateByScalarField', () => {
  it('counts unique values', () => {
    const result = aggregateByScalarField(posts, p => p.data.author);
    assert.deepEqual(result, [
      { name: 'David Sherlock', slug: 'david-sherlock', count: 2 },
      { name: 'Sean Tyas',      slug: 'sean-tyas',      count: 2 },
    ]);
  });

  it('skips null/empty/whitespace values', () => {
    const result = aggregateByScalarField(posts, p => p.data.author);
    assert.equal(result.length, 2);
    assert.ok(!result.some(r => r.slug === ''));
  });

  it('sorts by count desc then name asc', () => {
    const items = [
      { name: 'Zara' },
      { name: 'Adam' },
      { name: 'Adam' },
      { name: 'Bob' },
      { name: 'Bob' },
    ];
    const result = aggregateByScalarField(items, i => i.name);
    assert.equal(result[0].name, 'Adam'); // count 2, A first alphabetically
    assert.equal(result[1].name, 'Bob');
    assert.equal(result[2].name, 'Zara');
  });

  it('first-occurrence wins display name (different casing)', () => {
    const items = [
      { name: 'David Sherlock' },
      { name: 'david sherlock' },
      { name: 'DAVID SHERLOCK' },
    ];
    const result = aggregateByScalarField(items, i => i.name);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'David Sherlock');
    assert.equal(result[0].count, 3);
  });

  it('returns empty array for empty collection', () => {
    assert.deepEqual(aggregateByScalarField([], i => i.x), []);
  });

  it('supports custom slugFn', () => {
    const result = aggregateByScalarField(
      [{ name: 'Crème' }, { name: 'creme' }],
      i => i.name,
      { slugFn: (v) => v.toLowerCase().replace(/è/g, 'e') }
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].count, 2);
  });
});

// ── aggregateByListField ────────────────────

describe('aggregateByListField', () => {
  it('counts items across the list field', () => {
    const result = aggregateByListField(posts, p => p.data.tags);
    const byName = Object.fromEntries(result.map(r => [r.name, r.count]));
    assert.equal(byName.trance, 4);
    assert.equal(byName.house, 2);
    assert.equal(byName.progressive, 1);
  });

  it('per-item dedupe — duplicate tag in one post counts once', () => {
    const items = [{ tags: ['x', 'x', 'x'] }];
    const result = aggregateByListField(items, i => i.tags);
    assert.equal(result[0].count, 1);
  });

  it('skips empty/null lists', () => {
    const items = [{ tags: [] }, { tags: null }, { tags: undefined }];
    assert.deepEqual(aggregateByListField(items, i => i.tags), []);
  });

  it('sorts by count desc then name asc', () => {
    const items = [
      { tags: ['z', 'a'] },
      { tags: ['z'] },
      { tags: ['m'] },
    ];
    const result = aggregateByListField(items, i => i.tags);
    assert.equal(result[0].name, 'z'); // 2
    assert.equal(result[1].name, 'a'); // 1 (a before m alphabetically)
    assert.equal(result[2].name, 'm'); // 1
  });
});

// ── groupCollectionByScalarSlug ─────────────

describe('groupCollectionByScalarSlug', () => {
  it('buckets items by slug', () => {
    const result = groupCollectionByScalarSlug(posts, p => p.data.author);
    assert.equal(result.size, 2);
    const ds = result.get('david-sherlock');
    assert.equal(ds.name, 'David Sherlock');
    assert.equal(ds.items.length, 2);
    const st = result.get('sean-tyas');
    assert.equal(st.items.length, 2);
  });

  it('skips empty values', () => {
    const result = groupCollectionByScalarSlug(posts, p => p.data.author);
    assert.ok(!result.has(''));
  });

  it('first-occurrence sets the display name', () => {
    const items = [
      { name: 'David Sherlock', ord: 1 },
      { name: 'david sherlock', ord: 2 },
    ];
    const result = groupCollectionByScalarSlug(items, i => i.name);
    assert.equal(result.get('david-sherlock').name, 'David Sherlock');
    assert.equal(result.get('david-sherlock').items.length, 2);
  });

  it('returns empty map for empty input', () => {
    const result = groupCollectionByScalarSlug([], i => i.x);
    assert.equal(result.size, 0);
  });
});

// ── groupCollectionByListSlug ───────────────

describe('groupCollectionByListSlug', () => {
  it('buckets items by each list value', () => {
    const result = groupCollectionByListSlug(posts, p => p.data.tags);
    assert.equal(result.get('trance').items.length, 4);
    assert.equal(result.get('house').items.length, 2);
    assert.equal(result.get('progressive').items.length, 1);
  });

  it('per-item dedupe — duplicate tag puts the item in the bucket once', () => {
    const items = [{ id: 1, tags: ['x', 'x', 'x'] }];
    const result = groupCollectionByListSlug(items, i => i.tags);
    assert.equal(result.get('x').items.length, 1);
  });

  it('skips empty/null lists', () => {
    const items = [
      { id: 1, tags: ['a'] },
      { id: 2, tags: [] },
      { id: 3, tags: null },
    ];
    const result = groupCollectionByListSlug(items, i => i.tags);
    assert.equal(result.size, 1);
    assert.equal(result.get('a').items.length, 1);
  });

  it('returns empty map for empty input', () => {
    const result = groupCollectionByListSlug([], i => i.x);
    assert.equal(result.size, 0);
  });
});
