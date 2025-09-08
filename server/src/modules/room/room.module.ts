import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { EmailModule } from '../email/email.module';
import { AuctionsModule } from '../auctions/auctions.module';

@Module({
  imports: [EmailModule, AuctionsModule],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule {}
