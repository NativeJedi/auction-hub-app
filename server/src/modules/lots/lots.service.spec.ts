import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LotsService } from './lots.service';
import { Lot } from './entities/lots.entity';
import { LotImage } from './entities/lot-image.entity';
import { AuctionsService } from '../auctions/auctions.service';
import { StorageService } from '../storage/storage.service';
import { AuctionStatus } from '../auctions/entities/auction.entity';

const makeLot = (overrides: Record<string, unknown> = {}): any => ({
  id: 'lot-1',
  name: 'Watch',
  images: [],
  auction: { id: 'auction-1', status: AuctionStatus.CREATED },
  ...overrides,
});

describe('LotsService', () => {
  let service: LotsService;
  let lotsRepo: any;
  let auctionsService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LotsService,
        {
          provide: getRepositoryToken(Lot),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LotImage),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: AuctionsService,
          useValue: {
            findOne: jest.fn(),
            findEditableOne: jest.fn(),
            checkEditableStatus: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            getPublicUrl: jest.fn().mockReturnValue('http://cdn/img.webp'),
            createPresignedUploadUrls: jest.fn(),
            deleteObject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(LotsService);
    lotsRepo = module.get(getRepositoryToken(Lot));
    auctionsService = module.get(AuctionsService);
  });

  describe('createLots', () => {
    it('throws BadRequestException when auction is not editable', async () => {
      // T-002 AC: create lot is rejected when auction is STARTED or FINISHED
      auctionsService.findEditableOne.mockRejectedValue(
        new BadRequestException(
          'Auction cannot be edited after it has started',
        ),
      );

      await expect(
        service.createLots('user-1', 'auction-1', [{ name: 'Lot 1' } as any]),
      ).rejects.toThrow(BadRequestException);
    });

    it('saves and returns lots when auction is editable', async () => {
      auctionsService.findEditableOne.mockResolvedValue({ id: 'auction-1' });
      lotsRepo.save.mockResolvedValue([makeLot({ name: 'Lot 1' })]);

      const result = await service.createLots('user-1', 'auction-1', [
        { name: 'Lot 1' } as any,
      ]);

      expect(auctionsService.findEditableOne).toHaveBeenCalledWith(
        'user-1',
        'auction-1',
      );
      expect(result[0].name).toBe('Lot 1');
    });
  });

  describe('updateEditableLot', () => {
    it('throws NotFoundException when lot does not belong to the auction or user', async () => {
      // T-002 AC: throws NotFoundException when lot not found
      lotsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateEditableLot('user-1', 'auction-1', 'lot-999', {
          name: 'X',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when auction is not editable', async () => {
      // T-002 AC: throws BadRequestException when auction is STARTED or FINISHED
      lotsRepo.findOne.mockResolvedValue(
        makeLot({
          auction: { id: 'auction-1', status: AuctionStatus.STARTED },
        }),
      );
      auctionsService.checkEditableStatus.mockImplementation(() => {
        throw new BadRequestException(
          'Auction cannot be edited after it has started',
        );
      });

      await expect(
        service.updateEditableLot('user-1', 'auction-1', 'lot-1', {
          name: 'X',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('saves and returns mapped DTO when lot is found and auction is editable', async () => {
      // T-002 AC: saves lot and returns mapped DTO when auction and lot exist
      lotsRepo.findOne.mockResolvedValue(makeLot());
      lotsRepo.save.mockResolvedValue(makeLot({ name: 'New Name' }));

      const result = await service.updateEditableLot(
        'user-1',
        'auction-1',
        'lot-1',
        { name: 'New Name' },
      );

      expect(lotsRepo.save).toHaveBeenCalledWith({
        id: 'lot-1',
        name: 'New Name',
      });
      expect(result.name).toBe('New Name');
      expect(Array.isArray(result.images)).toBe(true);
    });
  });
});
