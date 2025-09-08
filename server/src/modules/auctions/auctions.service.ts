import { Injectable, NotFoundException } from '@nestjs/common';
import {
  UpdateAuctionDto,
  CreateAuctionDto,
  AuctionDto,
} from './dto/auction.dto';
import { User } from '../../modules/users/entities/user.entity';
import { UsersService } from '../../modules/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Auction } from './entities/auction.entity';
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
    { page, limit }: QueryPaginationDto,
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
    id: Auction['id'],
    updateAuctionDto: UpdateAuctionDto,
    ownerId: User['id'],
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
}
