import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Auction } from '../auctions/entities/auction.entity';
import {
  AddLotImageDto,
  CreateLotDto,
  LotDto,
  LotImageDto,
  PresignedUrlItemDto,
  UpdateLotDto,
} from './dto/lot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Lot } from './entities/lots.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AuctionsService } from '../auctions/auctions.service';
import { v4 as uuid } from 'uuid';
import { StorageService } from '../storage/storage.service';
import { LotImage } from './entities/lot-image.entity';

const getS3KeyPrefix = (lotId: Lot['id']) => `lots/${lotId}`;

@Injectable()
export class LotsService {
  constructor(
    @InjectRepository(Lot) private readonly lotsRepository: Repository<Lot>,
    @InjectRepository(LotImage)
    private readonly lotImageRepository: Repository<LotImage>,
    private readonly auctionsService: AuctionsService,
    private readonly storageService: StorageService,
  ) {}

  private mapLotEntityToDto(lot: Lot): LotDto {
    const images = (lot.images || []).map((image) => ({
      id: image.id,
      url: this.storageService.getPublicUrl(image.s3Key),
    }));

    return {
      ...lot,
      images,
    };
  }

  private findAuction(userId: User['id'], auctionId: Auction['id']) {
    return this.auctionsService.findOne(userId, auctionId);
  }

  async findAll(userId: User['id'], auctionId: Auction['id']) {
    const auction = await this.findAuction(userId, auctionId);

    const lots = await this.lotsRepository.find({
      where: { auction: { id: auction.id } },
      relations: ['buyer', 'images'],
    });

    return lots.map((lot) => this.mapLotEntityToDto(lot));
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

    return savedLots.map((lot) => this.mapLotEntityToDto(lot));
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

    return this.mapLotEntityToDto(lot);
  }

  async updateLot(
    userId: User['id'],
    auctionId: Auction['id'],
    lotId: Lot['id'],
    lot: UpdateLotDto,
  ) {
    await this.findLot(userId, auctionId, lotId);

    const savedLot = await this.lotsRepository.save({ id: lotId, ...lot });

    return this.mapLotEntityToDto(savedLot);
  }

  async removeLot(
    userId: User['id'],
    auctionId: Auction['id'],
    lotId: Lot['id'],
  ) {
    const auction = await this.findAuction(userId, auctionId);

    await this.lotsRepository.delete({ auction, id: lotId });
  }

  async createPresignedUrls(
    userId: User['id'],
    auctionId: Auction['id'],
    lotId: Lot['id'],
    count: number,
  ): Promise<PresignedUrlItemDto[]> {
    await this.findLot(userId, auctionId, lotId);

    const s3Keys = Array.from(
      { length: count },
      () => `${getS3KeyPrefix(lotId)}/${uuid()}.webp`,
    );

    return this.storageService.createPresignedUploadUrls(s3Keys);
  }

  async addImages(
    userId: User['id'],
    auctionId: Auction['id'],
    lotId: Lot['id'],
    images: AddLotImageDto[],
  ): Promise<LotImageDto[]> {
    const lot = await this.findLot(userId, auctionId, lotId);

    const s3KeyPrefix = getS3KeyPrefix(lotId);

    const invalidKey = images.find(
      ({ s3Key }) => !s3Key.startsWith(s3KeyPrefix),
    );

    if (invalidKey) {
      throw new ForbiddenException('Invalid s3Key');
    }

    const savedImages = await this.lotImageRepository.save(
      images.map(({ s3Key }) => ({ s3Key, lot })),
    );

    return savedImages.map((image) => ({
      id: image.id,
      url: this.storageService.getPublicUrl(image.s3Key),
    }));
  }

  async removeImage(
    userId: User['id'],
    auctionId: Auction['id'],
    lotId: Lot['id'],
    imageId: LotImage['id'],
  ) {
    await this.findLot(userId, auctionId, lotId); // check for the owner

    const image = await this.lotImageRepository.findOne({
      where: { id: imageId, lot: { id: lotId } },
    });

    if (!image) throw new NotFoundException('Image not found');

    await this.storageService.deleteObject(image.s3Key);
    await this.lotImageRepository.delete(image.id);
  }
}
