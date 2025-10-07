import { Module } from '@nestjs/common';
import { LotsService } from './lots.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lot } from './entities/lots.entity';
import { AuctionsModule } from '../auctions/auctions.module';
import { LotsController } from './lots.controller';

const LotsRepository = TypeOrmModule.forFeature([Lot]);

@Module({
  imports: [LotsRepository, AuctionsModule],
  controllers: [LotsController],
  providers: [LotsService],
  exports: [LotsService, AuctionsModule, LotsRepository],
})
export class LotsModule {}
