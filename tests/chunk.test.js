import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chunk } from '../src/index.js';

describe('chunk', () => {
  it('splits a list into pieces of at most size, in order', () => {
    assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
    assert.deepEqual(chunk([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
    assert.deepEqual(chunk(['a', 'b'], 5), [['a', 'b']]);
    assert.deepEqual(chunk([1, 2, 3], 1), [[1], [2], [3]]);
  });

  it('gives [] for an empty list, and leaves the list alone', () => {
    assert.deepEqual(chunk([], 3), []);
    const list = [1, 2, 3];
    chunk(list, 2);
    assert.deepEqual(list, [1, 2, 3]);
  });

  it('throws a RangeError for a size that is not a positive integer', () => {
    for (const size of [0, -1, 1.5, NaN, Infinity, '2', undefined]) {
      assert.throws(() => chunk([1, 2], size), RangeError);
    }
  });
});
