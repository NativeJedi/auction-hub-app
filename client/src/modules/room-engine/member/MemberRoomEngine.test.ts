import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberRoomEngine } from './MemberRoomEngine';
import { setRoomToken } from '@/src/utils/local-storage';
import type BaseSocket from '@/src/sockets/base-socket';

vi.mock('@/src/utils/local-storage', () => ({
  setRoomToken: vi.fn(),
  getRoomToken: vi.fn(),
}));

const stubSocket = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  onEvent: vi.fn(),
  onError: vi.fn(),
  emitEvent: vi.fn(),
  offEvent: vi.fn(),
} as unknown as BaseSocket;

describe('MemberRoomEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirmInvite stores token under room:${auctionId}:token key in localStorage', async () => {
    const mockApi = {
      fetchRoomInfo: vi.fn(),
      confirmRoomInvite: vi.fn().mockResolvedValue({ token: 'member-token' }),
    };

    const engine = new MemberRoomEngine('auction-1', stubSocket, mockApi);
    await engine.confirmInvite('invite-token-abc');

    expect(mockApi.confirmRoomInvite).toHaveBeenCalledWith('auction-1', { token: 'invite-token-abc' });
    expect(setRoomToken).toHaveBeenCalledWith('auction-1', 'member-token');
  });
});
