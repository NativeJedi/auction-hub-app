import { PickType } from '@nestjs/swagger';
import { Auction } from '../../auctions/entities/auction.entity';

export enum RoomRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class RoomAuction extends PickType(Auction, [
  'id',
  'name',
  'description',
]) {}

export class Room {
  id: string;
  ownerId: string;
  auction: RoomAuction;
}

export class RoomAuthorizedMember {
  id: string;
  roomId: Room['id'];
  email: string;
  name: string;
  role: RoomRole.MEMBER;
}

export class RoomAuthorizedOwner {
  id: string;
  roomId: Room['id'];
  email: string;
  role: RoomRole.ADMIN;
}

export type RoomAuthorizedUser = RoomAuthorizedMember | RoomAuthorizedOwner;
