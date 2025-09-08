import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateAuctionDto, CreateAuctionDto } from './dto/auction.dto';
import { User } from '../../modules/users/entities/user.entity';
import { UsersService } from '../../modules/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Auction } from './entities/auction.entity';
import { Repository } from 'typeorm';

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

  async create({ name, description }: CreateAuctionDto, ownerId: User['id']) {
    const owner = await this.findOwner(ownerId);

    const auction = {
      name,
      description,
      owner,
    };

    return this.auctionsRepository.save(auction);
  }

  async findAll(ownerId: User['id']) {
    const owner = await this.findOwner(ownerId);

    return this.auctionsRepository.findBy({ owner });
  }

  async findOne(id: Auction['id'], ownerId: User['id'], withLots = false) {
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
  ) {
    const owner = await this.findOwner(ownerId);

    const auction = await this.auctionsRepository.preload({
      id,
      owner,
      ...updateAuctionDto,
    });

    if (!auction) {
      throw new NotFoundException(`Auction with id ${id} not found`);
    }

    return this.auctionsRepository.save(auction);
  }

  async removeOne(id: Auction['id'], ownerId: User['id']) {
    const owner = await this.findOwner(ownerId);

    return this.auctionsRepository.delete({ owner, id });
  }
}
