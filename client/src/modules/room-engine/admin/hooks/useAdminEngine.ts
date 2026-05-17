import { useMemo } from 'react';
import { AdminRoomEngine } from '@/src/modules/room-engine/admin/AdminRoomEngine';
import BaseSocket from '@/src/sockets/base-socket';

export const useAdminEngine = (auctionId: string) => {
  return useMemo(
    () =>
      new AdminRoomEngine(auctionId, new BaseSocket(process.env.NEXT_PUBLIC_API_WEBSOCKET_URL ?? '')),
    [auctionId]
  );
};
