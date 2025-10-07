import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Room, RoomAuction } from './entities/room.entity';
import { RoomInvite } from './entities/room-invite.entity';
import { RoomMember } from './entities/room-member.entity';
import { RedisSimpleRepository } from '../redis/repositories/simple.repository';
import { RedisHashRepository } from '../redis/repositories/hash.repository';
import { AppConfigService } from '../../config/app-config.service';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateInviteDto } from './dto/invite.dto';
import { CreateBidDto } from './dto/bid.dto';
import { RedisListRepository } from '../redis/repositories/list.repository';
import { RoomLot } from './entities/room-lot.entity';
import { Bid } from './entities/bid.entity';

@Injectable()
export class RoomRepository {
  private readonly lotsList: RedisListRepository<RoomLot>;

  private readonly rooms: RedisSimpleRepository<Room>;

  private readonly invites: RedisHashRepository<RoomInvite>;

  private readonly members: RedisHashRepository<RoomMember>;

  private readonly activeLotId: RedisSimpleRepository<string>;

  private readonly bids: RedisListRepository<Bid>;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly redisService: RedisService,
  ) {
    const ttl = this.appConfig.jwt.JWT_ROOM_TTL;

    this.lotsList = this.redisService.createListRepository<RoomLot>(
      'lotsList',
      ttl,
    );

    this.rooms = this.redisService.createSimpleRepository<Room>('rooms', ttl);

    this.invites = this.redisService.createHashRepository<RoomInvite>(
      'invites',
      ttl,
    );

    this.members = this.redisService.createHashRepository<RoomMember>(
      'members',
      ttl,
    );

    this.activeLotId = this.redisService.createSimpleRepository<string>(
      'activeLotId',
      ttl,
    );

    this.bids = this.redisService.createListRepository<Bid>('bids', ttl);
  }

  private getRoomKey(roomId: string) {
    return `room:${roomId}`;
  }

  private getBidsKey(roomId: string, lotId: string) {
    return `bids:${roomId}:${lotId}`;
  }

  async createRoom(
    ownerId: string,
    auction: RoomAuction,
    lots: Array<RoomLot>,
  ): Promise<Room> {
    const room: Room = {
      auction,
      id: uuidv4(),
      ownerId,
    };

    const roomKey = this.getRoomKey(room.id);

    await this.rooms.set(roomKey, room);

    await this.setActiveLot(room.id, lots[0].id);

    await this.lotsList.pushMultiple(roomKey, lots);

    return room;
  }

  async getRoom(roomId: Room['id']): Promise<Room | null> {
    const roomKey = this.getRoomKey(roomId);

    const room = await this.rooms.get(roomKey);

    return room;
  }

  async getMembers(roomId: Room['id']): Promise<RoomMember[]> {
    const roomKey = this.getRoomKey(roomId);

    const members = await this.members.getList(roomKey);

    return members;
  }

  async getActiveLotBids(roomId: Room['id']): Promise<Bid[]> {
    const activeLotId = await this.getActiveLotId(roomId);

    if (!activeLotId) {
      return [];
    }

    return this.getLotBids(roomId, activeLotId);
  }

  async getActiveLotCurrentBid(roomId: Room['id']): Promise<Bid | undefined> {
    const activeLotBids = await this.getActiveLotBids(roomId);

    return activeLotBids.length
      ? activeLotBids[activeLotBids.length - 1]
      : activeLotBids[0];
  }

  async getActiveLotId(roomId: Room['id']): Promise<string | undefined> {
    const roomKey = this.getRoomKey(roomId);

    const activeLotId = await this.activeLotId.get(roomKey);

    return activeLotId || undefined;
  }

  async getLots(roomId: Room['id']): Promise<Array<RoomLot>> {
    const roomKey = this.getRoomKey(roomId);

    return this.lotsList.getAll(roomKey);
  }

  async getInvites(roomId: Room['id']): Promise<RoomInvite[]> {
    const roomKey = this.getRoomKey(roomId);

    return this.invites.getList(roomKey);
  }

  async getLotBids(roomId: Room['id'], lotId: RoomLot['id']): Promise<Bid[]> {
    const roomKey = this.getBidsKey(roomId, lotId);

    return this.bids.getAll(roomKey);
  }

  async getRoomInfo(roomId: Room['id']) {
    const activeLotIdPromise = this.getActiveLotId(roomId);

    const lotsPromise = this.getLots(roomId);

    const activeLotPromise = Promise.all([
      activeLotIdPromise,
      lotsPromise,
    ]).then(([activeLotId, lots]) => {
      if (!activeLotId) {
        return undefined;
      }

      return lots.find((lot) => lot.id === activeLotId);
    });

    const activeLotBidsPromise = activeLotIdPromise.then((id) => {
      if (!id) return [];

      return this.getLotBids(roomId, id);
    });

    const [room, lots, activeLot, activeLotBids, members, invites] =
      await Promise.all([
        this.getRoom(roomId),
        this.getLots(roomId),
        activeLotPromise,
        activeLotBidsPromise,
        this.getMembers(roomId),
        this.getInvites(roomId),
      ]);

    return {
      room,
      lots,
      activeLot,
      activeLotBids,
      members,
      invites,
    };
  }

  async getMemberByEmail(
    roomId: string,
    email: string,
  ): Promise<RoomMember | undefined> {
    const members = await this.members.getList(this.getRoomKey(roomId));
    return members.find((m) => m.email === email);
  }

  async getInviteByEmail(
    roomId: string,
    email: string,
  ): Promise<RoomInvite | undefined> {
    const invites = await this.invites.getList(this.getRoomKey(roomId));
    return invites.find((m) => m.email === email);
  }

  async createInvite(roomId: string, { email, name }: CreateInviteDto) {
    const roomKey = this.getRoomKey(roomId);

    const id = uuidv4();

    const invite = {
      id,
      email,
      name,
    };

    await this.invites.set(roomKey, email, invite);

    return invite;
  }

  async createMember(roomId: string, email: string) {
    const roomKey = this.getRoomKey(roomId);

    const room = await this.getRoom(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const invite = await this.getInviteByEmail(roomId, email);

    if (!invite) {
      throw new NotFoundException('User invite not found');
    }

    const member: RoomMember = {
      id: invite.id,
      email: invite.email,
      name: invite.name,
    };

    await this.members.set(roomKey, email, member);

    await this.invites.delOne(roomKey, email);

    return {
      room,
      member,
    };
  }

  async getNextLot(roomId: string): Promise<RoomLot> {
    const roomKey = this.getRoomKey(roomId);

    const activeLotId = await this.getActiveLotId(roomId);

    const lots = await this.lotsList.getAll(roomKey);

    if (!activeLotId) {
      return lots[0];
    }

    const activeLotIndex = lots.findIndex((lot) => lot.id === activeLotId);

    const nextLotIndex = activeLotIndex + 1;

    const nextLot = lots[nextLotIndex];

    return nextLot || undefined;
  }

  async setActiveLot(roomId: string, id: RoomLot['id']) {
    const roomKey = this.getRoomKey(roomId);

    await this.activeLotId.set(roomKey, id);
  }

  async getLotCurrentBid(
    roomId: string,
    lotId: RoomLot['id'],
  ): Promise<Bid | undefined> {
    const bids = await this.getLotBids(roomId, lotId);

    if (!bids.length) {
      return undefined;
    }

    return bids[bids.length - 1];
  }

  async setBid(roomId: string, member: RoomMember, bid: CreateBidDto) {
    const activeLotId = await this.getActiveLotId(roomId);

    if (!activeLotId) {
      throw new NotFoundException('No active lot');
    }

    if (bid.lotId !== activeLotId) {
      throw new ConflictException('Active lot is changed');
    }

    const currentBid = await this.getLotCurrentBid(roomId, activeLotId);

    const newBid: Bid = {
      id: member.id,
      name: member.name,
      email: member.email,
      amount: currentBid ? currentBid.amount + bid.amount : bid.amount,
    };

    await this.bids.push(this.getBidsKey(roomId, activeLotId), newBid);

    return newBid;
  }

  async clearRoom(id: Room['id']) {
    const roomKey = this.getRoomKey(id);

    await Promise.all([
      this.activeLotId.clear(roomKey),
      this.members.clear(roomKey),
      this.lotsList.clear(roomKey),
      this.rooms.clear(roomKey),
      this.invites.clear(roomKey),
      this.bids.clear(roomKey),
    ]);
  }
}
