import type { PublicBidInfo, RoomAuction, RoomLot } from '@/src/api/dto/room.dto';
import { Lifecycle } from '@/src/modules/room-engine/core/types';

export type PublicRoomData = {
  auction: RoomAuction | null;
  activeLot: RoomLot | null;
  bids: PublicBidInfo[];
};

export type PublicRoomState = PublicRoomData & Lifecycle;
