import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { User } from '../users/entities/user.entity';
import { Auction } from '../auctions/entities/auction.entity';
import { AuctionsService } from '../auctions/auctions.service';

@Injectable()
export class RoomService {
  constructor(
    private readonly redisService: RedisService,
    private readonly auctionsService: AuctionsService,
  ) {}

  async createRoom(ownerId: User['id'], auctionId: Auction['id']) {
    await this.auctionsService.findOne(ownerId, auctionId);

    const id = Date.now().toString();

    const room = {
      id,
    };

    await this.redisService.set(`auction:room:${id}`, JSON.stringify(room));

    return room;
  }

  async addUserToRoom(roomId: string, userId: User['id']) {}
}
