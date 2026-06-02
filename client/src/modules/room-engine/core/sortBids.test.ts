import { describe, it, expect } from 'vitest';
import { sortBidsByAmountDesc } from './sortBids';

describe('sortBidsByAmountDesc', () => {
  it('orders bids by amount, highest first', () => {
    const result = sortBidsByAmountDesc([{ amount: 100 }, { amount: 300 }, { amount: 200 }]);

    expect(result.map((b) => b.amount)).toEqual([300, 200, 100]);
  });

  it('does not mutate the input array', () => {
    const input = [{ amount: 100 }, { amount: 300 }];

    sortBidsByAmountDesc(input);

    expect(input.map((b) => b.amount)).toEqual([100, 300]);
  });

  it('returns an empty array for empty input', () => {
    expect(sortBidsByAmountDesc([])).toEqual([]);
  });
});
