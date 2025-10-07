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
import { RoomService } from './room.service';
import { BidDto, CreateBidDto } from './dto/bid.dto';
import { Injectable, OnModuleDestroy, UseGuards } from '@nestjs/common';
import { WSRoomRolesGuard } from './guards/ws-roles.guard';
import {
  RoomAuthorizedMember,
  RoomAuthorizedOwner,
  RoomAuthorizedUser,
  RoomRole,
} from './entities/room.entity';
import { RoomRoles, RoomSockerUser } from './guards/decorators';
import { RoomLot } from './entities/room-lot.entity';

type PublishEvent = {
  room: string;
  ev: string;
  data: unknown;
};

@Injectable()
@WebSocketGateway({
  cors: true,
  namespace: '/ws/room',
})
export class RoomGateway implements OnModuleDestroy {
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

      this.server.to(event.room).emit(event.ev, event.data);
    });
  }

  private getRoomKey(roomId: string) {
    return `room:${roomId}`;
  }

  private getUserRoomKey(roomId: string, userId: string) {
    return `${this.getRoomKey(roomId)}:${userId}`;
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token as string;

    if (!token) {
      client.disconnect(true);
      return;
    }

    const result = this.tokenService.roomMemberToken.validate(token);

    if (!result.payload) {
      client.disconnect(true);
      return;
    }

    const { payload } = result;

    if (!this.subscribedRooms.has(payload.roomId)) {
      await this.sub.subscribe(this.getRoomKey(payload.roomId));
      this.subscribedRooms.add(payload.roomId);
    }

    if (!this.subscribedRooms.has(payload.sub)) {
      await this.sub.subscribe(
        this.getUserRoomKey(payload.roomId, payload.sub),
      );
      this.subscribedRooms.add(payload.sub);
    }

    const { sub: id, ...otherProps } = payload;

    client.data.user = {
      id,
      ...otherProps,
    };
  }

  private readonly publishEvent = (event: PublishEvent) => {
    this.pub.publish(event.room, JSON.stringify(event));
  };

  publishRoomEvent(roomId: string, ev: string, data: unknown) {
    const roomEvent: PublishEvent = {
      room: this.getRoomKey(roomId),
      ev,
      data,
    };

    this.publishEvent(roomEvent);
  }

  publishRoomUserEvent(
    roomId: string,
    userId: string,
    ev: string,
    data: unknown,
  ) {
    const roomEvent: PublishEvent = {
      room: this.getUserRoomKey(roomId, userId),
      ev,
      data,
    };

    this.publishEvent(roomEvent);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @RoomSockerUser() user: RoomAuthorizedUser,
  ) {
    if (!user) {
      client.disconnect(true);
      return;
    }

    await client.join(this.getRoomKey(user.roomId));
    await client.join(this.getUserRoomKey(user.roomId, user.id));
  }

  @UseGuards(WSRoomRolesGuard)
  @RoomRoles(RoomRole.ADMIN)
  @SubscribeMessage('placeLot')
  async handlePlaceLot(
    @ConnectedSocket() client: Socket,
    @RoomSockerUser() user: RoomAuthorizedOwner,
  ) {
    try {
      const data: RoomLot = await this.roomService.placeNextLot(user);

      this.publishRoomEvent(user.roomId, 'newLot', data);
    } catch (e) {
      client.emit('error', { message: e.message });
    }
  }

  @UseGuards(WSRoomRolesGuard)
  @RoomRoles(RoomRole.MEMBER)
  @SubscribeMessage('placeBid')
  async handleBid(
    @MessageBody() bid: CreateBidDto,
    @ConnectedSocket() client: Socket,
    @RoomSockerUser() user: RoomAuthorizedMember,
  ) {
    try {
      const newBid: BidDto = await this.roomService.placeBid(user, bid);

      // TODO: hide email for members channel
      this.publishRoomEvent(user.roomId, 'newBid', newBid);
    } catch (e) {
      client.emit('error', { message: e.message });
    }
  }

  @UseGuards(WSRoomRolesGuard)
  @RoomRoles(RoomRole.ADMIN)
  @SubscribeMessage('finishAuction')
  async handleFinishAuction(
    @ConnectedSocket() client: Socket,
    @RoomSockerUser() user: RoomAuthorizedOwner,
  ) {
    try {
      await this.roomService.finishAuction(user);

      this.publishRoomEvent(user.roomId, 'auctionFinished', {});
    } catch (e) {
      client.emit('error', { message: e.message });
    }
  }

  onModuleDestroy() {
    this.sub?.disconnect?.();
    this.pub?.disconnect?.();
  }
}
