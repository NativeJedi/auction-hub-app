import { Lot } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';

type RoomAuction = Pick<Auction, 'id' | 'name' | 'description'>;

export type Room = {
  id: string;
  ownerId: string;
  auction: RoomAuction;
};

export type CreateRoomResponseDto = {
  room: Room;
  token: string;
};

export type RoomMember = {
  id: string;
  name: string;
  email: string;
};

export type RoomBid = RoomMember & {
  amount: number;
};

export type RoomLot = Pick<Lot, 'id' | 'name' | 'description' | 'startPrice' | 'currency'>;

export type RoomInvite = Pick<RoomMember, 'id' | 'name' | 'email'>;

export type RoomAdminInfoResponseDto = {
  room: Room;

  lots: RoomLot[];

  activeLot: RoomLot;

  activeLotBids: RoomBid[];

  members: RoomMember[];

  invites: RoomInvite[];
};

export type MemberBidInfo = Pick<RoomBid, 'name' | 'amount'>;

export type RoomMemberInfoResponseDto = {
  room: {
    id: Room['id'];

    auction: Pick<RoomAuction, 'name' | 'description'>;
  };

  activeLot?: RoomLot;

  activeLotBids: MemberBidInfo[];
};

export type SendInviteDto = {
  name: string;
  email: string;
};

export type ConfirmRoomInviteDto = {
  token: string;
};

export type ConfirmRoomInviteResponseDto = {
  token: string;
};
