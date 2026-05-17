import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRoomToken, setRoomToken } from './local-storage';

describe('getRoomToken', () => {
  const mockStorage = { getItem: vi.fn(), setItem: vi.fn() };

  beforeEach(() => {
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns value stored under room:${auctionId}:token', () => {
    mockStorage.getItem.mockReturnValue('stored-token');

    const result = getRoomToken('auction-99');

    expect(mockStorage.getItem).toHaveBeenCalledWith('room:auction-99:token');
    expect(result).toBe('stored-token');
  });
});

describe('setRoomToken', () => {
  const mockStorage = { getItem: vi.fn(), setItem: vi.fn() };

  beforeEach(() => {
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes value to localStorage under room:${auctionId}:token', () => {
    setRoomToken('auction-99', 'my-token');

    expect(mockStorage.setItem).toHaveBeenCalledWith('room:auction-99:token', 'my-token');
  });
});
