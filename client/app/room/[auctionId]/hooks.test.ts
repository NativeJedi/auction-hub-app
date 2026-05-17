import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useParams } from 'next/navigation';
import { useAuctionId } from './hooks';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

describe('useAuctionId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct param from mock useParams', () => {
    (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ auctionId: 'test-id-99' });

    expect(useAuctionId()).toBe('test-id-99');
  });
});
