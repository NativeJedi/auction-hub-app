import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminRoomEngine } from './AdminRoomEngine';
import { setRoomToken } from '@/src/utils/local-storage';

vi.mock('@/src/utils/local-storage', () => ({
  setRoomToken: vi.fn(),
  getRoomToken: vi.fn(),
}));

vi.mock('@/src/api/auctions-api-client/requests/room', () => ({
  startAuction: vi.fn(),
  fetchAdminRoomInfo: vi.fn(),
  finishAuction: vi.fn(),
  resetAuction: vi.fn(),
}));

describe('AdminRoomEngine.resetAuction', () => {
  it('calls api.resetAuction with the correct auctionId', async () => {
    // DoD: resetAuction() delegates to api.resetAuction with { auctionId }
    const mockSocket = { onEvent: vi.fn(), emitEvent: vi.fn() } as any;
    const mockApi = {
      fetchAdminRoomInfo: vi.fn(),
      finishAuction: vi.fn(),
      resetAuction: vi.fn().mockResolvedValue(undefined),
    };
    const engine = new AdminRoomEngine('auction-1', mockSocket, mockApi);

    await engine.resetAuction();

    expect(mockApi.resetAuction).toHaveBeenCalledWith({ auctionId: 'auction-1' });
  });
});

describe('AdminRoomEngine.startAuction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('startAuction stores token under room:${auctionId}:token key in localStorage', async () => {
    const { startAuction } = await import('@/src/api/auctions-api-client/requests/room');
    (startAuction as ReturnType<typeof vi.fn>).mockResolvedValue({
      room: { auctionId: 'auction-1' },
      token: 'admin-token',
    });

    await AdminRoomEngine.startAuction('auction-1');

    expect(setRoomToken).toHaveBeenCalledWith('auction-1', 'admin-token');
  });
});
