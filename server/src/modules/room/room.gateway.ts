import { Redis } from 'ioredis';
import { RedisService } from '../redis/redis.service';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../auth/token.service';
import { Member } from './entities/member.entity';
import { RoomService } from './room.service';
import { BidDto } from './dto/bid.dto';
import { RoomRole } from '../../guards/room-roles/room-roles.constants';
import { RoomRoleGuard } from '../../guards/room-roles/room-roles.guard';
import { UseGuards } from '@nestjs/common';
import {
  RoomRoles,
  RoomUser,
} from '../../guards/room-roles/room-roles.decorator';
import { BidEntity } from './entities/active-lot.entity';
import { PlaceLotDto } from './dto/lot.dto';

type BaseEvent<E, T = {}> = {
  roomId: string;
  ev: E;
  data: T;
};

type JoinedRoomEvent = BaseEvent<'joinedRoom', Member>;

type NewLotEvent = BaseEvent<'newLot', PlaceLotDto>;

type NewBidEvent = BaseEvent<'newBid', BidEntity>;

type AuctionFinishedEvent = BaseEvent<'auctionFinished'>;

type PublishEvent =
  | JoinedRoomEvent
  | NewLotEvent
  | NewBidEvent
  | AuctionFinishedEvent;

@WebSocketGateway({ cors: true, namespace: '/ws/room' })
export class RoomGateway {
  private readonly pub: Redis;
  private readonly sub: Redis;

  private subscribedRooms = new Set<string>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService,
    private readonly roomService: RoomService,
  ) {
    const client = this.redisService.getClient();

    this.pub = client.duplicate();
    this.sub = client.duplicate();

    this.sub.on('message', (_, e) => {
      const event: PublishEvent = JSON.parse(e);

      this.server.to(event.roomId).emit(event.ev, event.data);
    });
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token as string;

    const payload = this.tokenService.validateRoomToken(token);

    if (!payload) {
      client.disconnect(true);
      return;
    }

    if (!this.subscribedRooms.has(payload.roomId)) {
      await this.sub.subscribe(`auction-events:${payload.roomId}`);
      this.subscribedRooms.add(payload.roomId);
    }

    const { sub: id, ...otherProps } = payload;

    const member: Member = {
      id,
      ...otherProps,
    };

    client.data.user = member;
  }

  publishEvent(event: PublishEvent) {
    this.pub.publish(`auction-events:${event.roomId}`, JSON.stringify(event));
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @RoomUser() user: Member,
  ) {
    await client.join(user.roomId);

    this.publishEvent({
      roomId: user.roomId,
      ev: 'joinedRoom',
      data: user,
    });
  }

  @UseGuards(RoomRoleGuard)
  @RoomRoles(RoomRole.ADMIN)
  @SubscribeMessage('placeLot')
  async handlePlaceLot(
    @ConnectedSocket() client: Socket,
    @RoomUser() user: Member,
  ) {
    try {
      const { lot, total } = await this.roomService.placeLot(
        user.auctionId,
        user.roomId,
      );

      this.publishEvent({
        roomId: user.roomId,
        ev: 'newLot',
        data: { lot, total },
      });
    } catch (e) {
      client.emit('error', { message: e.message });
    }
  }

  @UseGuards(RoomRoleGuard)
  @RoomRoles(RoomRole.MEMBER)
  @SubscribeMessage('placeBid')
  async handleBid(
    @MessageBody() bid: BidDto,
    @ConnectedSocket() client: Socket,
    @RoomUser() user: Member,
  ) {
    try {
      const newBid = await this.roomService.placeBid(user, bid);

      this.publishEvent({
        roomId: user.roomId,
        ev: 'newBid',
        data: newBid,
      });
    } catch (e) {
      client.emit('error', { message: e.message });
    }
  }

  @UseGuards(RoomRoleGuard)
  @RoomRoles(RoomRole.ADMIN)
  @SubscribeMessage('finishAuction')
  async handleFinishAuction(
    @ConnectedSocket() client: Socket,
    @RoomUser() user: Member,
  ) {
    try {
      await this.roomService.finishAuction(user.auctionId, user.roomId);

      this.publishEvent({
        roomId: user.roomId,
        ev: 'auctionFinished',
        data: {},
      });
    } catch (e) {
      client.emit('error', { message: e.message });
    }
  }
}
