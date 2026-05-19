import { useMemo } from 'react';
import { PublicRoomEngine } from '@/src/modules/room-engine/public/PublicRoomEngine';
import BaseSocket from '@/src/sockets/base-socket';
import { getRoomSocketUrl } from '@/src/sockets/socket-url';

export const usePublicEngine = (auctionId: string) => {
  return useMemo(
    () => new PublicRoomEngine(auctionId, new BaseSocket(getRoomSocketUrl())),
    [auctionId]
  );
};
