import { useMemo } from 'react';
import { MemberRoomEngine } from '@/src/modules/room-engine/member/MemberRoomEngine';
import BaseSocket from '@/src/sockets/base-socket';

export const useMemberEngine = (auctionId: string) => {
  const engine = useMemo(
    () =>
      new MemberRoomEngine(auctionId, new BaseSocket(process.env.NEXT_PUBLIC_API_WEBSOCKET_URL ?? '')),
    [auctionId]
  );

  return engine;
};
