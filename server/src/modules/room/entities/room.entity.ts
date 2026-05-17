import { PickType } from '@nestjs/swagger';
import { Auction } from '../../auctions/entities/auction.entity';

export enum RoomRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class RoomAuction extends PickType(Auction, [
  'name',
  'description',
]) {}

export class Room {
  auctionId: string;
  ownerId: string;
  auction: RoomAuction;
}

export class RoomAuthorizedMember {
  id: string;
  auctionId: Room['auctionId'];
  email: string;
  name: string;
  role: RoomRole.MEMBER;
}

export class RoomAuthorizedOwner {
  id: string;
  auctionId: Room['auctionId'];
  email: string;
  role: RoomRole.ADMIN;
}

export type RoomAuthorizedUser = RoomAuthorizedMember | RoomAuthorizedOwner;
