import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { EmailModule } from '../email/email.module';
import { AuctionsModule } from '../auctions/auctions.module';
import { RoomGateway } from './room.gateway';
import { RoomRepository } from './room.repository';
import { BuyersModule } from '../buyers/buyers.module';

@Module({
  imports: [EmailModule, AuctionsModule, BuyersModule],
  controllers: [RoomController],
  providers: [RoomService, RoomGateway, RoomRepository],
})
export class RoomModule {}
