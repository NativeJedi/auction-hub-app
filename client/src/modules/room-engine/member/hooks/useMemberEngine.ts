import { useMemo } from 'react';
import { MemberRoomEngine } from '@/src/modules/room-engine/member/MemberRoomEngine';
import BaseSocket from '@/src/sockets/base-socket';

export const useMemberEngine = (roomId: string) => {
  const engine = useMemo(
    () =>
      new MemberRoomEngine(roomId, new BaseSocket(process.env.NEXT_PUBLIC_API_WEBSOCKET_URL ?? '')),
    [roomId]
  );

  return engine;
};
