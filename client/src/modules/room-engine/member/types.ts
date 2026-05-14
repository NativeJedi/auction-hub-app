import type { PublicBidInfo, RoomAuction, RoomLot, RoomUser } from '@/src/api/dto/room.dto';
import { Lifecycle } from '@/src/modules/room-engine/core/types';

export type MemberRoomData = {
  auction: RoomAuction | null;
  activeLot: RoomLot | null;
  bids: PublicBidInfo[];
  user: RoomUser | null;
  bidIncrement: number;
};

export type MemberRoomState = MemberRoomData & Lifecycle;
