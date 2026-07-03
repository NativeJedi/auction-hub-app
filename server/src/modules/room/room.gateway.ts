import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../auth/token.service';
import { RoomService } from './room.service';
import { CreateBidDto, PublicBidDto } from './dto/bid.dto';
import { Injectable, Logger, UseFilters, UseGuards } from '@nestjs/common';
import { WSRoomRolesGuard } from './guards/ws-roles.guard';
import {
  RoomAuthorizedMember,
  RoomAuthorizedOwner,
  RoomAuthorizedUser,
  RoomRole,
} from './entities/room.entity';
import { RoomRoles, RoomSockerUser } from './guards/decorators';
import { WsExceptionFilter } from './filters/ws-exception.filter';

@Injectable()
@UseFilters(WsExceptionFilter)
@WebSocketGateway({
  cors: process.env.NODE_ENV !== 'production',
  namespace: '/ws/room',
})
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RoomGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly tokenService: TokenService,
    private readonly roomService: RoomService,
  ) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) return next(new Error('Unauthorized'));

      const result = this.tokenService.roomMemberToken.validate(token);
      if (!result.payload) return next(new Error('Unauthorized'));

      const { sub: id, ...rest } = result.payload;
      (socket.data as Record<string, unknown>).user = { id, ...rest };
      next();
    });
  }

  private getRoomKey(auctionId: string) {
    return `room:${auctionId}`;
  }

  private getUserRoomKey(auctionId: string, userId: string) {
    return `${this.getRoomKey(auctionId)}:${userId}`;
  }

  async handleConnection(client: Socket) {
    const user = (client.data as { user: RoomAuthorizedUser }).user;

    await client.join(this.getRoomKey(user.auctionId));

    // Personal channel is admin-only: only the owner receives newInvite and newMember events
    if (user.role === RoomRole.ADMIN) {
      await client.join(this.getUserRoomKey(user.auctionId, user.id));
    }

    this.logger.log({
      msg: 'WS client connected',
      roomId: user.auctionId,
      userId: user.id,
      role: user.role,
    });
  }

  handleDisconnect(client: Socket) {
    // user is undefined if the auth middleware rejected the handshake
    const user = (client.data as { user?: RoomAuthorizedUser }).user;

    this.logger.log({
      msg: 'WS client disconnected',
      roomId: user?.auctionId,
      userId: user?.id,
    });
  }

  publishRoomEvent(roomId: string, ev: string, data: unknown) {
    this.server.to(this.getRoomKey(roomId)).emit(ev, data);
  }

  publishRoomUserEvent(
    roomId: string,
    userId: string,
    ev: string,
    data: unknown,
  ) {
    this.server.to(this.getUserRoomKey(roomId, userId)).emit(ev, data);
  }

  @UseGuards(WSRoomRolesGuard)
  @RoomRoles(RoomRole.ADMIN)
  @SubscribeMessage('placeLot')
  async handlePlaceLot(@RoomSockerUser() user: RoomAuthorizedOwner) {
    // Errors propagate to WsExceptionFilter: it logs them with room/user
    // context and emits a client-safe 'error' event.
    const result = await this.roomService.placeNextLot(user);

    if (result.autoFinished) {
      this.publishRoomEvent(user.auctionId, 'auctionFinished', {});
    } else {
      this.publishRoomEvent(user.auctionId, 'newLot', result.lot);
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
    const newBid = await this.roomService.placeBid(user, bid);
    const publicBid: PublicBidDto = {
      id: newBid.id,
      userId: newBid.userId,
      name: newBid.name,
      amount: newBid.amount,
    };
    this.publishRoomEvent(user.auctionId, 'newBid', publicBid);
  }
}
