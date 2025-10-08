import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Buyer } from './entities/buyer.entity';
import { Repository } from 'typeorm';
import { CreateBuyerDto } from './dto/buyer.dto';
import { Lot } from '../lots/entities/lots.entity';
import { LotsService } from '../lots/lots.service';
import { User } from '../users/entities/user.entity';
import { Auction } from '../auctions/entities/auction.entity';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(Buyer)
    private readonly buyersRepository: Repository<Buyer>,
    private readonly lotsService: LotsService,
  ) {}

  async saveBuyer(
    userId: User['id'],
    auctionId: Auction['id'],
    lotId: Lot['id'],
    buyer: CreateBuyerDto,
  ): Promise<Buyer> {
    const lot = await this.lotsService.findLot(userId, auctionId, lotId);

    return this.buyersRepository.save({
      ...buyer,
      lot,
    });
  }
}
