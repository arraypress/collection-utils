import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sumBy, countBy, rankBy, ratio, percentChange } from '../src/index.js';

const lines = [
  { product: 'Prism', country: 'TH', amount: 2900 },
  { product: 'Night Shift', country: 'GB', amount: 4900 },
  { product: 'Prism', country: 'TH', amount: 2900 },
  { product: 'Tape Loops', country: null, amount: 1500 },
  { product: 'Lo-Fi Drums', country: 'US', amount: 5800 },
];

describe('sumBy', () => {
  it('adds a value across items, any iterable', () => {
    assert.equal(sumBy(lines, (l) => l.amount), 18000);
    assert.equal(sumBy([], (l) => l.amount), 0);
    assert.equal(sumBy(new Set([1, 2, 3]), (n) => n), 6);
  });
});

describe('countBy', () => {
  it('counts by key, leaving out null and undefined, in first-seen order', () => {
    assert.deepEqual([...countBy(lines, (l) => l.country)], [['TH', 2], ['GB', 1], ['US', 1]]);
    assert.deepEqual([...countBy([{}], (x) => x.missing)], []);
  });
});

describe('rankBy', () => {
  it('ranks groups by total, then count, then first seen', () => {
    assert.deepEqual(rankBy(lines, (l) => l.product, (l) => l.amount), [
      { name: 'Prism', count: 2, total: 5800 },
      { name: 'Lo-Fi Drums', count: 1, total: 5800 },
      { name: 'Night Shift', count: 1, total: 4900 },
      { name: 'Tape Loops', count: 1, total: 1500 },
    ]);
  });

  it('keeps ties in the order they appeared, and stops at a limit', () => {
    const ties = [{ k: 'b' }, { k: 'a' }, { k: 'c' }];
    assert.deepEqual(rankBy(ties, (t) => t.k, () => 1).map((g) => g.name), ['b', 'a', 'c']);
    assert.deepEqual(rankBy(lines, (l) => l.product, (l) => l.amount, 2).map((g) => g.name), ['Prism', 'Lo-Fi Drums']);
    assert.deepEqual(rankBy(lines, (l) => l.country, (l) => l.amount).map((g) => g.name), ['TH', 'US', 'GB']);
  });
});

describe('ratio', () => {
  it('divides safely, rounded', () => {
    assert.equal(ratio(3, 24), 0.125);
    assert.equal(ratio(1, 3), 0.333);
    assert.equal(ratio(1, 3, 1), 0.3);
    assert.equal(ratio(5, 0), null);
    assert.equal(ratio(0, 10), 0);
  });
});

describe('percentChange', () => {
  it('gives the change in percent, null from nothing', () => {
    assert.equal(percentChange(1350, 1200), 12.5);
    assert.equal(percentChange(900, 1200), -25);
    assert.equal(percentChange(1, 3, 2), -66.67);
    assert.equal(percentChange(50, 0), null);
    assert.equal(percentChange(0, 0), null);
  });
});
