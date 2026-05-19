import { useMemo } from 'react';
import { MemberRoomEngine } from '@/src/modules/room-engine/member/MemberRoomEngine';
import BaseSocket from '@/src/sockets/base-socket';
import { getRoomSocketUrl } from '@/src/sockets/socket-url';

export const useMemberEngine = (auctionId: string) => {
  const engine = useMemo(
    () => new MemberRoomEngine(auctionId, new BaseSocket(getRoomSocketUrl())),
    [auctionId]
  );

  return engine;
};
