import { useMemo } from 'react';
import { AdminRoomEngine } from '@/src/modules/room-engine/admin/AdminRoomEngine';
import BaseSocket from '@/src/sockets/base-socket';
import { getRoomSocketUrl } from '@/src/sockets/socket-url';

export const useAdminEngine = (auctionId: string) => {
  return useMemo(
    () => new AdminRoomEngine(auctionId, new BaseSocket(getRoomSocketUrl())),
    [auctionId]
  );
};
