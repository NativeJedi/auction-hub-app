import { Injectable, NotFoundException } from '@nestjs/common';
import { Auction } from '../auctions/entities/auction.entity';
import { CreateLotDto, UpdateLotDto } from './dto/lot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Lot } from './entities/lots.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AuctionsService } from '../auctions/auctions.service';

@Injectable()
export class LotsService {
  constructor(
    @InjectRepository(Lot) private readonly lotsRepository: Repository<Lot>,
    private readonly auctionsService: AuctionsService,
  ) {}

  findAuction(userId: User['id'], auctionId: Auction['id']) {
    return this.auctionsService.findOne(userId, auctionId);
  }

  async findAll(userId: User['id'], auctionId: Auction['id']) {
    const auction = await this.findAuction(userId, auctionId);

    return this.lotsRepository.findBy({
      auction: { id: auction.id },
    });
  }

  async createLots(
    userId: User['id'],
    auctionId: Auction['id'],
    lots: CreateLotDto[],
  ) {
    // TODO: limit lots creation count
    const auction = await this.findAuction(userId, auctionId);

    const createdLots = lots.map((lot) => ({
      ...lot,
      auction,
    }));

    const savedLots = await this.lotsRepository.save(createdLots);

    return savedLots.map(({ auction, ...lot }) => lot);
  }

  async findLot(
    userId: User['id'],
    auctionId: Auction['id'],
    lotId: Lot['id'],
  ) {
    const auction = await this.findAuction(userId, auctionId);

    const lot = await this.lotsRepository.findOne({
      where: {
        id: lotId,
        auction: { id: auction.id },
      },
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    return lot;
  }

  async updateLot(
    userId: User['id'],
    auctionId: Auction['id'],
    lotId: Lot['id'],
    lot: UpdateLotDto,
  ) {
    const lotToUpdate = await this.findLot(userId, auctionId, lotId);

    return this.lotsRepository.save({
      ...lotToUpdate,
      ...lot,
    });
  }

  async removeLot(
    userId: User['id'],
    auctionId: Auction['id'],
    lotId: Lot['id'],
  ) {
    const auction = await this.findAuction(userId, auctionId);

    await this.lotsRepository.delete({ auction, id: lotId });
  }
}
