import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { AuctionsService } from './auctions.service';
import { Auction } from './entities/auction.entity';
import { UsersService } from '../users/users.service';
import { LotStatus } from '../lots/entities/lots.entity';
import { Currency } from '../../types/currency';
import { RoomRepository } from '../room/room.repository';

const makeAuction = (lots: any[] = []): any => ({
  id: 'auction-1',
  name: 'Spring Auction',
  description: null,
  finishedAt: null,
  lots,
});

const makeSoldLot = (overrides: Record<string, unknown> = {}): any => ({
  id: 'lot-1',
  name: 'Watch',
  status: LotStatus.SOLD,
  soldPrice: 1000,
  currency: Currency.USD,
  buyer: { id: 'b-1', name: 'Alice', email: 'alice@example.com' },
  ...overrides,
});

const makeUnsoldLot = (overrides: Record<string, unknown> = {}): any => ({
  id: 'lot-2',
  name: 'Vase',
  status: LotStatus.UNSOLD,
  soldPrice: null,
  currency: Currency.USD,
  buyer: null,
  ...overrides,
});

describe('AuctionsService', () => {
  let service: AuctionsService;

  let auctionRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionsService,
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
        {
          provide: getRepositoryToken(Auction),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
            preload: jest.fn(),
          },
        },
        {
          provide: getDataSourceToken(),
          useValue: { transaction: jest.fn() },
        },
        {
          provide: RoomRepository,
          useValue: { clearRoom: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AuctionsService);
    auctionRepo = module.get(getRepositoryToken(Auction));
  });

  describe('resetAuction', () => {
    it.todo(
      'calls roomRepository.clearRoom with auctionId before the transaction',
    );
    it.todo('calls DataSource.transaction');
    it.todo(
      'within the transaction: resets lots, deletes buyers, resets auction status',
    );
    it.todo('throws NotFoundException when auction not found for owner');
    it.todo('skips buyer deletion when no lots have a buyer');
  });

  describe('getAuctionResults', () => {
    it('returns correct soldCount, unsoldCount, and totalValue for a mixed set of lots', async () => {
      auctionRepo.findOne.mockResolvedValue(
        makeAuction([
          makeSoldLot({ id: 'lot-1', soldPrice: 1500, currency: Currency.USD }),
          makeSoldLot({ id: 'lot-2', soldPrice: 800, currency: Currency.USD }),
          makeUnsoldLot({ id: 'lot-3' }),
        ]),
      );

      const result = await service.getAuctionResults('auction-1');

      expect(result.totalLots).toBe(3);
      expect(result.soldCount).toBe(2);
      expect(result.unsoldCount).toBe(1);
      expect(result.valuesByCurrency).toEqual({ USD: 2300 });
    });

    it('throws NotFoundException when auction id does not exist', async () => {
      auctionRepo.findOne.mockResolvedValue(null);

      await expect(service.getAuctionResults('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('excludes buyer email from lot results', async () => {
      auctionRepo.findOne.mockResolvedValue(
        makeAuction([
          makeSoldLot({ buyer: { name: 'Alice', email: 'alice@example.com' } }),
        ]),
      );

      const result = await service.getAuctionResults('auction-1');

      expect(result.lots[0].buyerName).toBe('Alice');
      expect(result.lots[0]).not.toHaveProperty('email');
      expect(result.lots[0]).not.toHaveProperty('buyerEmail');
    });

    it('returns null buyerName for unsold lots', async () => {
      auctionRepo.findOne.mockResolvedValue(makeAuction([makeUnsoldLot()]));

      const result = await service.getAuctionResults('auction-1');

      expect(result.lots[0].buyerName).toBeNull();
    });

    it('aggregates sold values into separate entries per currency', async () => {
      auctionRepo.findOne.mockResolvedValue(
        makeAuction([
          makeSoldLot({ id: 'lot-1', soldPrice: 500, currency: Currency.USD }),
          makeSoldLot({ id: 'lot-2', soldPrice: 300, currency: Currency.EUR }),
          makeSoldLot({ id: 'lot-3', soldPrice: 200, currency: Currency.USD }),
        ]),
      );

      const result = await service.getAuctionResults('auction-1');

      expect(result.valuesByCurrency).toEqual({ USD: 700, EUR: 300 });
    });

    it('skips a sold lot with null soldPrice when building valuesByCurrency', async () => {
      auctionRepo.findOne.mockResolvedValue(
        makeAuction([
          makeSoldLot({ id: 'lot-1', soldPrice: 1000, currency: Currency.USD }),
          makeSoldLot({ id: 'lot-2', soldPrice: null, currency: Currency.USD }),
        ]),
      );

      const result = await service.getAuctionResults('auction-1');

      expect(result.valuesByCurrency).toEqual({ USD: 1000 });
    });

    it('counts lots with created status toward unsoldCount', async () => {
      auctionRepo.findOne.mockResolvedValue(
        makeAuction([
          makeSoldLot({ id: 'lot-1' }),
          makeUnsoldLot({ id: 'lot-2', status: LotStatus.CREATED }),
        ]),
      );

      const result = await service.getAuctionResults('auction-1');

      expect(result.soldCount).toBe(1);
      expect(result.unsoldCount).toBe(1);
    });
  });
});
