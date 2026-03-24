import { Module } from '@nestjs/common';
import { LotsService } from './lots.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lot } from './entities/lots.entity';
import { AuctionsModule } from '../auctions/auctions.module';
import { LotsController } from './lots.controller';
import { LotImage } from './entities/lot-image.entity';
import { AppConfigService } from '../../config/app-config.service';
import { StorageModule } from '../storage/storage.module';

const LotsRepository = TypeOrmModule.forFeature([Lot, LotImage]);

@Module({
  imports: [LotsRepository, AuctionsModule, StorageModule],
  controllers: [LotsController],
  providers: [LotsService, AppConfigService],
  exports: [LotsService, AuctionsModule, LotsRepository],
})
export class LotsModule {}
