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

type AuctionEvent = {
  roomId: string;
  ev: string;
  data: any;
};

@WebSocketGateway({ cors: true })
export class RoomGateway {
  private readonly pub: Redis;
  private readonly sub: Redis;

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

    this.sub.subscribe('auction-events');

    this.sub.on('message', (_, e) => {
      const event: AuctionEvent = JSON.parse(e);

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

    const { sub: id, ...otherProps } = payload;

    const member: Member = {
      id,
      ...otherProps,
    };

    client.data.user = member;
  }

  publishEvent(roomId: string, ev: string, data: any = {}) {
    this.pub.publish(
      'auction-events',
      JSON.stringify({
        roomId,
        ev,
        data,
      }),
    );
  }

  @UseGuards(RoomRoleGuard)
  @RoomRoles(RoomRole.ADMIN)
  @SubscribeMessage('start')
  async handleStart(@RoomUser() user: Member) {
    const lot = await this.roomService.startNextLot(
      user.auctionId,
      user.roomId,
    );

    if (!lot) {
      this.publishEvent(user.roomId, 'finishAuction');
    } else {
      this.publishEvent(user.roomId, 'newLot', lot);
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @RoomUser() user: Member,
  ) {
    const room = await this.roomService.findRoom(
      user.auctionId,
      user.auctionId,
    );

    if (!room) {
      client.emit('error', { message: 'Room not found' });
      return;
    }

    await client.join(user.roomId);

    this.publishEvent(user.roomId, 'joinedRoom', user);
  }

  @UseGuards(RoomRoleGuard)
  @RoomRoles(RoomRole.MEMBER)
  @SubscribeMessage('bid')
  async handleBid(
    @MessageBody() bid: BidDto,
    @ConnectedSocket() client: Socket,
    @RoomUser() user: Member,
  ) {
    try {
      const newBid = await this.roomService.placeBid(user, bid);

      this.publishEvent(user.roomId, 'newBid', newBid);
    } catch (e) {
      client.emit('error', { message: e.message });
    }
  }
}
