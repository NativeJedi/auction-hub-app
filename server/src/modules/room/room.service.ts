import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Auction } from '../auctions/entities/auction.entity';
import { AuctionsService } from '../auctions/auctions.service';
import { TokenService } from '../auth/token.service';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../email/email.service';
import { CreateInviteDto } from './dto/invite.dto';
import { Member } from './entities/member.entity';
import { Room, RoomAdmin } from './entities/room.entity';
import { RedisQueueRepository } from '../redis/repositories/queue.repository';
import { Lot } from '../lots/entities/lots.entity';
import { RedisSimpleRepository } from '../redis/repositories/simple.repository';
import { RedisHashRepository } from '../redis/repositories/hash.repository';
import { Invite } from './entities/invite.entity';
import { ActiveLot, BidEntity } from './entities/active-lot.entity';
import { BidDto } from './dto/bid.dto';
import { RoomRole } from '../../guards/room-roles/room-roles.constants';

@Injectable()
export class RoomService {
  private readonly lotsQueue: RedisQueueRepository<Lot>;

  private readonly rooms: RedisSimpleRepository<Room>;

  private readonly invites: RedisHashRepository<Invite>;

  private readonly members: RedisHashRepository<Member>;

  private readonly activeLot: RedisSimpleRepository<ActiveLot>;

  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  private getRoomKey(auctionId: string, roomId: string) {
    return `auction:${auctionId}:room:${roomId}`;
  }

  async createRoom(owner: RoomAdmin, auctionId: Auction['id']) {
    const { lots } = await this.auctionsService.findOne(
      owner.id,
      auctionId,
      true,
    );

    const room: Room = {
      auctionId,
      id: uuidv4(),
      owner,
    };

    const token = this.tokenService.generateRoomToken({
      sub: owner.id,
      email: owner.email,
      role: RoomRole.ADMIN,
      auctionId,
      roomId: room.id,
    });

    const roomKey = this.getRoomKey(auctionId, room.id);

    await this.rooms.set(roomKey, room);

    await this.lotsQueue.push(roomKey, ...lots);

    return { room, token };
  }

  async findRoom(auctionId: string, roomId: string): Promise<Room> {
    const room = await this.rooms.get(this.getRoomKey(auctionId, roomId));

    if (!room) {
      throw new NotFoundException('Room for this auction not found');
    }

    return room;
  }

  async findMemberByEmail(auctionId: string, roomId: string, email: string) {
    const members = await this.members.getList(
      this.getRoomKey(auctionId, roomId),
    );

    return members.find((m) => m.email === email);
  }

  async createRoomInvite(
    auctionId: string,
    roomId: string,
    dto: CreateInviteDto,
  ) {
    const room = await this.findRoom(auctionId, roomId);

    const roomKey = this.getRoomKey(auctionId, room.id);

    const existingInvite = await this.invites.get(roomKey, dto.email);

    if (existingInvite) {
      throw new ConflictException('Invite already exists');
    }

    const existingUser = await this.findMemberByEmail(
      auctionId,
      roomId,
      dto.email,
    );

    if (existingUser) {
      throw new ConflictException('User already in room');
    }

    const userId = uuidv4();

    const token = this.tokenService.generateRoomInviteToken({
      sub: userId,
      email: dto.email,
    });

    // TODO: insert real link
    await this.emailService.sendEmail(
      dto.email,
      'Room invite',
      `Hi, you registered as ${dto.name} for auction. Here is your invite: ${token}`,
    );

    await this.invites.set(roomKey, dto.email, {
      userId,
      email: dto.email,
      name: dto.name,
    });

    return {
      message: 'Invite sent to user email',
    };
  }

  async confirmRoomInvite(auctionId: string, roomId: string, token: string) {
    const payload = this.tokenService.validateRoomInviteToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired invite token');
    }

    const roomKey = this.getRoomKey(auctionId, roomId);

    const { email } = payload;

    const invite = await this.invites.get(roomKey, email);

    if (!invite) {
      throw new NotFoundException('User invite not found');
    }

    const member: Member = {
      id: invite.userId,
      email: invite.email,
      name: invite.name,
      auctionId,
      roomId,
      role: RoomRole.MEMBER,
    };

    const roomToken = this.tokenService.generateRoomToken({
      sub: invite.userId,
      ...member,
    });

    await this.members.set(roomKey, member.id, member);

    await this.invites.del(roomKey, email);

    return {
      message: 'Invite confirmed',
      token: roomToken,
      member,
    };
  }

  async startNextLot(auctionId: string, roomId: string) {
    const room = await this.findRoom(auctionId, roomId);
    const roomKey = this.getRoomKey(auctionId, room.id);

    const activeLot = await this.activeLot.get(roomKey);

    if (activeLot) {
      // TODO: save sold lot into postgre
    }

    const lot = await this.lotsQueue.pop(roomKey);

    if (!lot) {
      this.activeLot.del(roomKey);
      return null;
    }

    const newLot = {
      ...lot,
      roomId: room.id,
      auctionId,
    };

    this.activeLot.set(roomKey, newLot);

    return newLot;
  }

  async placeBid(member: Member, { amount, lotId }: BidDto) {
    const roomKey = this.getRoomKey(member.auctionId, member.roomId);

    const activeLot = await this.activeLot.get(roomKey);

    if (!activeLot || activeLot?.id !== lotId) {
      throw new BadRequestException('Lot is not active');
    }

    const newBid: BidEntity = {
      id: member.id,
      name: member.name,
      email: member.email,
      amount: activeLot.bid ? activeLot.bid.amount + amount : amount,
    };

    activeLot.bid = newBid;

    await this.activeLot.set(roomKey, activeLot);

    return newBid;
  }
}
