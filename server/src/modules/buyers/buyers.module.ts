import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Buyer } from './entities/buyer.entity';
import { BuyersService } from './buyers.service';
import { LotsModule } from '../lots/lots.module';

const BuyerRepository = TypeOrmModule.forFeature([Buyer]);

@Module({
  imports: [BuyerRepository, LotsModule],
  providers: [BuyersService],
  exports: [BuyersService, LotsModule, BuyerRepository],
})
export class BuyersModule {}
