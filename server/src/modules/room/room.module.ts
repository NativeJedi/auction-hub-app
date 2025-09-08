import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';

@Module({
  imports: [RedisModule],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule {}
