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
import { RoomDto } from './dto/room.dto';

@WebSocketGateway({ cors: true })
export class RoomGateway {
  private readonly pub: Redis;
  private readonly sub: Redis;

  @WebSocketServer()
  server: Server;

  constructor(private readonly redisService: RedisService) {
    const client = this.redisService.getClient();

    this.pub = client.duplicate();
    this.sub = client.duplicate();

    this.sub.on('message', (channel, message) => {
      if (channel === 'bids') {
        const bid = JSON.parse(message);

        this.server.to(bid.roomId).emit('bid', JSON.parse(message));
      }
    });
  }

  @SubscribeMessage('joinRoom')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: RoomDto['id'] },
  ) {
    await client.join(data.id);
    client.emit('joinedRoom', { roomId: data.id });
  }

  @SubscribeMessage('bid')
  async handleBid(
    @MessageBody() bid: BidDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.auctionService.placeBid(bid);
    await this.pub.publish('bids', JSON.stringify(result));
    return result;
  }
}
