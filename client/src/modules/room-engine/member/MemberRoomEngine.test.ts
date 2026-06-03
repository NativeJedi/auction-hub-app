import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberRoomEngine } from './MemberRoomEngine';
import { RoomEngine } from '../core/RoomEngine';
import type BaseSocket from '@/src/sockets/base-socket';

const stubSocket = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  onEvent: vi.fn(),
  onError: vi.fn(),
  emitEvent: vi.fn(),
  offEvent: vi.fn(),
} as unknown as BaseSocket;

describe('MemberRoomEngine', () => {
  let setRoomTokenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setRoomTokenSpy = vi.spyOn(RoomEngine, 'setRoomToken').mockImplementation(() => {});
  });

  it('confirmInvite stores token under room:${auctionId}:token key in localStorage', async () => {
    const mockApi = {
      fetchRoomInfo: vi.fn(),
      confirmRoomInvite: vi.fn().mockResolvedValue({ token: 'member-token' }),
    };

    const engine = new MemberRoomEngine('auction-1', stubSocket, mockApi);
    await engine.confirmInvite('invite-token-abc');

    expect(mockApi.confirmRoomInvite).toHaveBeenCalledWith('auction-1', {
      token: 'invite-token-abc',
    });
    expect(setRoomTokenSpy).toHaveBeenCalledWith('auction-1', 'member-token');
  });

  describe('placeBid', () => {
    const mockApi = { fetchRoomInfo: vi.fn(), confirmRoomInvite: vi.fn() };

    it('emits placeBid with the absolute amount (leadingAmount + bidIncrement) and the active lotId', () => {
      const engine = new MemberRoomEngine('auction-1', stubSocket, mockApi);
      (engine as any).setState({
        bids: [{ id: 'b1', userId: 'u1', name: 'A', email: 'a@e', amount: 1000 }],
        activeLot: { id: 'lot-1', startPrice: 100 },
        bidIncrement: 500,
      });

      engine.placeBid();

      expect(stubSocket.emitEvent).toHaveBeenCalledWith('placeBid', {
        amount: 1500,
        lotId: 'lot-1',
      });
    });

    it('uses the active lot startPrice as the baseline when no leading bid exists', () => {
      const engine = new MemberRoomEngine('auction-1', stubSocket, mockApi);
      (engine as any).setState({
        bids: [],
        activeLot: { id: 'lot-1', startPrice: 100 },
        bidIncrement: 50,
      });

      engine.placeBid();

      expect(stubSocket.emitEvent).toHaveBeenCalledWith('placeBid', {
        amount: 150,
        lotId: 'lot-1',
      });
    });
  });

  describe('newBid event', () => {
    it('keeps the bids list sorted by amount descending after a new bid arrives', () => {
      const engine = new MemberRoomEngine('auction-1', stubSocket, {
        fetchRoomInfo: vi.fn(),
        confirmRoomInvite: vi.fn(),
      });
      (engine as any).registerSocketEvents();
      (engine as any).setState({
        bids: [
          { id: 'b1', amount: 1000 },
          { id: 'b2', amount: 500 },
        ],
      });

      const onEventMock = stubSocket.onEvent as unknown as ReturnType<typeof vi.fn>;
      const newBidCall = onEventMock.mock.calls.find((call) => call[0] === 'newBid');
      const newBidHandler = newBidCall![1] as (bid: unknown) => void;

      newBidHandler({ id: 'b3', amount: 700 });

      expect(engine.getState().bids.map((b) => b.amount)).toEqual([1000, 700, 500]);
    });

    it('ignores a duplicate newBid (same id) to prevent double-counting after a reconnect', () => {
      const engine = new MemberRoomEngine('auction-1', stubSocket, {
        fetchRoomInfo: vi.fn(),
        confirmRoomInvite: vi.fn(),
      });
      (engine as any).registerSocketEvents();

      const onEventMock = stubSocket.onEvent as unknown as ReturnType<typeof vi.fn>;
      const newBidCall = onEventMock.mock.calls.find((call) => call[0] === 'newBid');
      const newBidHandler = newBidCall![1] as (bid: unknown) => void;

      const bid = { id: 'b1', userId: 'u1', name: 'Alice', amount: 1000 };
      newBidHandler(bid);
      newBidHandler(bid); // duplicate — same id, must be ignored

      expect(engine.getState().bids).toHaveLength(1);
    });
  });
});
