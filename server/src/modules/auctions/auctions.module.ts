import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from './entities/auction.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

const AuctionsRepository = TypeOrmModule.forFeature([Auction]);

@Module({
  imports: [AuctionsRepository, UsersModule, AuthModule],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsRepository, UsersModule, AuctionsService, AuthModule],
})
export class AuctionsModule {}
