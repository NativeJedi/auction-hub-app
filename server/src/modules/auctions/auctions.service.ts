import { Injectable, NotFoundException } from '@nestjs/common';
import {
  UpdateAuctionDto,
  CreateAuctionDto,
  AuctionDto,
} from './dto/auction.dto';
import { AuctionResultsDto, LotResultDto } from './dto/auction-results.dto';
import { User } from '../../modules/users/entities/user.entity';
import { UsersService } from '../../modules/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Auction, AuctionStatus } from './entities/auction.entity';
import { LotStatus } from '../lots/entities/lots.entity';
import { Repository } from 'typeorm';
import {
  PaginatedResponseDto,
  QueryPaginationDto,
} from '../pagination/pagination.dto';

@Injectable()
export class AuctionsService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
  ) {}

  async findOwner(ownerId: User['id']) {
    const owner = await this.usersService.findById(ownerId);

    if (!owner) {
      throw new NotFoundException(`User with id ${ownerId} not found`);
    }

    return owner;
  }

  async create(
    { name, description }: CreateAuctionDto,
    ownerId: User['id'],
  ): Promise<AuctionDto> {
    const owner = await this.findOwner(ownerId);

    const auction = {
      name,
      description,
      owner,
    };

    const { owner: aucOwner, ...response } =
      await this.auctionsRepository.save(auction);

    return response;
  }

  async findAll(
    ownerId: User['id'],
    { page = 1, limit = 10 }: QueryPaginationDto,
  ): Promise<PaginatedResponseDto<AuctionDto>> {
    const owner = await this.findOwner(ownerId);

    const [items, count] = await this.auctionsRepository.findAndCount({
      where: { owner },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      limit,
    };
  }

  async findOne(ownerId: User['id'], id: Auction['id'], withLots = false) {
    const owner = await this.findOwner(ownerId);

    const auction = await this.auctionsRepository.findOne({
      where: { id, owner },
      relations: withLots ? ['lots'] : [],
    });

    if (!auction) {
      throw new NotFoundException(`Auction with id ${id} not found`);
    }

    return auction;
  }

  async updateOne(
    ownerId: User['id'],
    id: Auction['id'],
    updateAuctionDto: UpdateAuctionDto,
  ): Promise<AuctionDto> {
    const owner = await this.findOwner(ownerId);

    const auction = await this.auctionsRepository.preload({
      id,
      owner,
      ...updateAuctionDto,
    });

    if (!auction) {
      throw new NotFoundException(`Auction with id ${id} not found`);
    }

    const { owner: aucOwner, ...response } =
      await this.auctionsRepository.save(auction);

    return response;
  }

  async removeOne(id: Auction['id'], ownerId: User['id']) {
    const owner = await this.findOwner(ownerId);

    await this.auctionsRepository.delete({ owner, id });
  }

  async markAsFinished(id: string): Promise<void> {
    await this.auctionsRepository.update(
      { id },
      { status: AuctionStatus.FINISHED, finishedAt: new Date() },
    );
  }

  async getAuctionResults(auctionId: string): Promise<AuctionResultsDto> {
    const auction = await this.auctionsRepository.findOne({
      where: { id: auctionId },
      relations: ['lots', 'lots.buyer'],
    });

    if (!auction) {
      throw new NotFoundException(`Auction with id ${auctionId} not found`);
    }

    const lots: LotResultDto[] = auction.lots.map((lot) => ({
      id: lot.id,
      name: lot.name,
      status: lot.status,
      soldPrice: lot.soldPrice ?? null,
      buyerName: lot.buyer?.name ?? null,
    }));

    const soldRawLots = auction.lots.filter((l) => l.status === LotStatus.SOLD);

    const valuesByCurrency = soldRawLots.reduce<Record<string, number>>((acc, lot) => {
      if (lot.soldPrice == null) return acc;
      acc[lot.currency] = (acc[lot.currency] ?? 0) + lot.soldPrice;
      return acc;
    }, {});

    return {
      id: auction.id,
      name: auction.name,
      description: auction.description ?? null,
      finishedAt: auction.finishedAt,
      totalLots: lots.length,
      soldCount: soldRawLots.length,
      unsoldCount: lots.length - soldRawLots.length,
      valuesByCurrency,
      lots,
    };
  }
}
