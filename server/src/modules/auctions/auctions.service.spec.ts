import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { AuctionsService } from './auctions.service';
import { Auction, AuctionStatus } from './entities/auction.entity';
import { UsersService } from '../users/users.service';
import { Lot, LotStatus } from '../lots/entities/lots.entity';
import { Buyer } from '../buyers/entities/buyer.entity';
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
  let dataSource: { transaction: jest.Mock };

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
    dataSource = module.get(getDataSourceToken()) as any;
  });

  describe('resetAuction', () => {
    let manager: Record<string, any>;

    beforeEach(() => {
      manager = {
        findOne: jest.fn().mockResolvedValue({ id: 'auction-1' }),
        find: jest.fn().mockResolvedValue([]),
        createQueryBuilder: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({}),
        }),
        delete: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      };
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
    });

    it('calls DataSource.transaction', async () => {
      await service.resetAuction('user-1', 'auction-1');

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('within the transaction: resets lots, deletes buyers, and resets auction status', async () => {
      const lotsWithBuyer = [
        { id: 'lot-1', buyer: { id: 'b-1' } },
        { id: 'lot-2', buyer: { id: 'b-2' } },
      ];
      manager.find.mockResolvedValue(lotsWithBuyer);

      await service.resetAuction('user-1', 'auction-1');

      expect(manager.createQueryBuilder).toHaveBeenCalled();
      expect(manager.delete).toHaveBeenCalledWith(Buyer, ['b-1', 'b-2']);
      expect(manager.update).toHaveBeenCalledWith(
        Auction,
        { id: 'auction-1' },
        { status: AuctionStatus.CREATED, finishedAt: null },
      );
    });

    it('skips buyer deletion when no lots have a buyer', async () => {
      manager.find.mockResolvedValue([{ id: 'lot-1', buyer: null }]);

      await service.resetAuction('user-1', 'auction-1');

      expect(manager.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when auction not found for owner', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.resetAuction('user-1', 'auction-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    // "calls roomRepository.clearRoom before transaction" is not applicable here:
    // AuctionsService does not inject RoomRepository. Clearing the room before restart
    // is the responsibility of RoomService.resetAuction (tested in room.service.spec.ts).
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

  describe('findOne', () => {
    it.todo('returns finishedAt when auction status is FINISHED');
    it.todo('returns null for finishedAt when auction status is CREATED');
  });

  describe('updateOne', () => {
    it.todo('throws BadRequestException when auction status is STARTED');
    it.todo('throws BadRequestException when auction status is FINISHED');
    it.todo('saves and returns updated auction when status is CREATED');
  });
});
