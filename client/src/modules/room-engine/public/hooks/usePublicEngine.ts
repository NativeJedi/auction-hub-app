import { useMemo } from 'react';
import { PublicRoomEngine } from '@/src/modules/room-engine/public/PublicRoomEngine';
import BaseSocket from '@/src/sockets/base-socket';

export const usePublicEngine = (roomId: string) => {
  return useMemo(
    () =>
      new PublicRoomEngine(roomId, new BaseSocket(process.env.NEXT_PUBLIC_API_WEBSOCKET_URL ?? '')),
    [roomId]
  );
};
