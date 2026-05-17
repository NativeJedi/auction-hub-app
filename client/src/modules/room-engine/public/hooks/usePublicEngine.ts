import { useMemo } from 'react';
import { PublicRoomEngine } from '@/src/modules/room-engine/public/PublicRoomEngine';
import BaseSocket from '@/src/sockets/base-socket';

export const usePublicEngine = (auctionId: string) => {
  return useMemo(
    () =>
      new PublicRoomEngine(auctionId, new BaseSocket(process.env.NEXT_PUBLIC_API_WEBSOCKET_URL ?? '')),
    [auctionId]
  );
};
