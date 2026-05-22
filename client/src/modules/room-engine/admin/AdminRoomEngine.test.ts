import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminRoomEngine } from './AdminRoomEngine';
import { RoomEngine } from '../core/RoomEngine';

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
  let setRoomTokenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setRoomTokenSpy = vi.spyOn(RoomEngine, 'setRoomToken').mockImplementation(() => {});
  });

  it('startAuction stores token under room:${auctionId}:token key in localStorage', async () => {
    const { startAuction } = await import('@/src/api/auctions-api-client/requests/room');
    (startAuction as ReturnType<typeof vi.fn>).mockResolvedValue({
      room: { auctionId: 'auction-1' },
      token: 'admin-token',
    });

    await AdminRoomEngine.startAuction('auction-1');

    expect(setRoomTokenSpy).toHaveBeenCalledWith('auction-1', 'admin-token');
  });
});
