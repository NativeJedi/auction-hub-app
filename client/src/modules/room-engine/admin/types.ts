import type { RoomAuction, RoomBid, RoomInvite, RoomLot, RoomMember } from '@/src/api/dto/room.dto';
import { Lifecycle } from '@/src/modules/room-engine/core/types';

export type AdminRoomData = {
  auction: RoomAuction | null;
  activeLot: RoomLot | null;
  lots: RoomLot[];
  bids: RoomBid[];
  members: RoomMember[];
  invites: RoomInvite[];
};

export type AdminRoomState = AdminRoomData & Lifecycle;
