import { Lot } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';

export type RoomAuction = Pick<Auction, 'name' | 'description'>;

export type Room = {
  auctionId: string;
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

export type RoomBid = {
  id: string;
  userId: string;
  name: string;
  email: string;
  amount: number;
};

export type RoomLot = Pick<
  Lot,
  'id' | 'name' | 'description' | 'startPrice' | 'currency' | 'images' | 'status' | 'soldPrice'
>;

export type RoomInvite = Pick<RoomMember, 'id' | 'name' | 'email'>;

export type RoomAdminInfoResponseDto = {
  room: Room;

  lots: RoomLot[];

  activeLot: RoomLot;

  activeLotBids: RoomBid[];

  members: RoomMember[];

  invites: RoomInvite[];
};

export type PublicBidInfo = Pick<RoomBid, 'id' | 'userId' | 'name' | 'amount'>;

export type RoomUser = {
  id: string;
  name: string;
  email: string;
};

export type RoomInfoResponseDto = {
  room: {
    auctionId: Room['auctionId'];

    auction: RoomAuction;
  };

  activeLot?: RoomLot;

  activeLotBids: PublicBidInfo[];

  user?: RoomUser;
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
