import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { AuctionsService } from '../auctions/auctions.service';
import { TokenService } from '../auth/token.service';
import { EmailService } from '../email/email.service';
import { RoomRepository } from './room.repository';
import { BuyersService } from '../buyers/buyers.service';
import { LotsService } from '../lots/lots.service';
import { AppConfigService } from '../../config/app-config.service';
import { AuctionStatus } from '../auctions/entities/auction.entity';
import { RoomRole } from './entities/room.entity';

const owner = {
  id: 'user-1',
  auctionId: 'auction-1',
  email: 'owner@example.com',
  role: RoomRole.ADMIN as const,
};

const mockRoom = {
  auctionId: 'auction-1',
  ownerId: 'user-1',
  auction: { name: 'Test Auction', description: null },
};

describe('RoomService', () => {
  let service: RoomService;
  let auctionsService: Record<string, jest.Mock>;
  let tokenService: {
    roomMemberToken: { generate: jest.Mock };
    roomMemberInviteToken: { generate: jest.Mock; validate: jest.Mock };
  };
  let roomRepository: Record<string, jest.Mock>;
  let lotsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: AppConfigService,
          useValue: { urls: { CLIENT_URL: 'http://localhost:3001' } },
        },
        {
          provide: AuctionsService,
          useValue: {
            findOne: jest.fn(),
            startAuction: jest.fn(),
            finishAuction: jest.fn(),
            restartAuction: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            roomMemberToken: { generate: jest.fn().mockReturnValue('room-token') },
            roomMemberInviteToken: {
              generate: jest.fn().mockReturnValue('invite-token'),
              validate: jest.fn(),
            },
          },
        },
        { provide: EmailService, useValue: { sendEmail: jest.fn() } },
        {
          provide: RoomRepository,
          useValue: {
            roomExists: jest.fn(),
            createRoom: jest.fn(),
            getRoom: jest.fn(),
            clearRoom: jest.fn(),
            getActiveLotId: jest.fn(),
            getActiveLotCurrentBid: jest.fn(),
            getNextLot: jest.fn(),
            setActiveLot: jest.fn(),
          },
        },
        { provide: BuyersService, useValue: { saveBuyer: jest.fn() } },
        {
          provide: LotsService,
          useValue: {
            findAll: jest.fn(),
            bulkMarkUnsold: jest.fn(),
            updateLot: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(RoomService);
    auctionsService = module.get(AuctionsService) as any;
    tokenService = module.get(TokenService) as any;
    roomRepository = module.get(RoomRepository) as any;
    lotsService = module.get(LotsService) as any;

    jest.clearAllMocks();
  });

  // Sets up the minimum mocks required for finishActiveLot to succeed (no active bid → UNSOLD)
  const stubFinishActiveLot = () => {
    roomRepository.getRoom.mockResolvedValue(mockRoom);
    roomRepository.getActiveLotId.mockResolvedValue('lot-1');
    roomRepository.getActiveLotCurrentBid.mockResolvedValue(undefined);
    lotsService.updateLot.mockResolvedValue(undefined);
  };

  describe('createRoom', () => {
    const user = { sub: 'user-1', email: 'owner@example.com' } as any;
    const lots = [{ id: 'lot-1', name: 'Lot 1', startPrice: 100, currency: 'USD' }];

    beforeEach(() => {
      auctionsService.findOne.mockResolvedValue({
        id: 'auction-1',
        name: 'Test',
        description: null,
        status: AuctionStatus.CREATED,
      });
      lotsService.findAll.mockResolvedValue(lots);
      roomRepository.roomExists.mockResolvedValue(false);
      roomRepository.createRoom.mockResolvedValue(mockRoom);
      tokenService.roomMemberToken.generate.mockReturnValue('room-token');
      auctionsService.startAuction.mockResolvedValue(undefined);
    });

    it('passes auctionId as room id to repository (room.id === auctionId)', async () => {
      await service.createRoom(user, 'auction-1');

      expect(roomRepository.createRoom).toHaveBeenCalledWith(
        'user-1',
        'auction-1',
        expect.any(Object),
        lots,
      );
    });

    it('calls auctionsService.startAuction with auctionId only (no roomId arg)', async () => {
      await service.createRoom(user, 'auction-1');

      expect(auctionsService.startAuction).toHaveBeenCalledWith('auction-1');
      expect(auctionsService.startAuction).toHaveBeenCalledTimes(1);
    });

    it('throws UnprocessableEntityException when roomRepository.roomExists returns true', async () => {
      roomRepository.roomExists.mockResolvedValue(true);

      await expect(service.createRoom(user, 'auction-1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('generates token with auctionId field (not roomId)', async () => {
      await service.createRoom(user, 'auction-1');

      expect(tokenService.roomMemberToken.generate).toHaveBeenCalledWith(
        expect.objectContaining({ auctionId: mockRoom.auctionId }),
      );
    });
  });

  describe('placeNextLot', () => {
    const nextLot = { id: 'lot-2', name: 'Lot 2', startPrice: 200, currency: 'USD' } as any;

    beforeEach(() => {
      stubFinishActiveLot();
      roomRepository.setActiveLot.mockResolvedValue(undefined);
      lotsService.bulkMarkUnsold.mockResolvedValue(undefined);
      auctionsService.finishAuction.mockResolvedValue(undefined);
      roomRepository.clearRoom.mockResolvedValue(undefined);
    });

    it('returns { lot, autoFinished: false } when a next lot exists', async () => {
      roomRepository.getNextLot.mockResolvedValue(nextLot);

      const result = await service.placeNextLot(owner);

      expect(result).toEqual({ lot: nextLot, autoFinished: false });
    });

    it('returns { lot: null, autoFinished: true } when no next lot remains', async () => {
      roomRepository.getNextLot.mockResolvedValue(undefined);

      const result = await service.placeNextLot(owner);

      expect(result).toEqual({ lot: null, autoFinished: true });
    });

    it('calls finishActiveLot before checking for the next lot', async () => {
      roomRepository.getNextLot.mockResolvedValue(nextLot);
      const finishActiveLotSpy = jest
        .spyOn(service as any, 'finishActiveLot')
        .mockResolvedValue(undefined);

      await service.placeNextLot(owner);

      const finishOrder = finishActiveLotSpy.mock.invocationCallOrder[0];
      const getNextLotOrder = roomRepository.getNextLot.mock.invocationCallOrder[0];
      expect(finishOrder).toBeLessThan(getNextLotOrder);
    });

    it('calls completeAuction (bulkMarkUnsold + finishAuction + clearRoom) on auto-finish', async () => {
      roomRepository.getNextLot.mockResolvedValue(undefined);

      await service.placeNextLot(owner);

      expect(lotsService.bulkMarkUnsold).toHaveBeenCalledWith('auction-1');
      expect(auctionsService.finishAuction).toHaveBeenCalledWith('auction-1');
      expect(roomRepository.clearRoom).toHaveBeenCalledWith('auction-1');
    });

    it('does NOT call completeAuction when a next lot exists', async () => {
      roomRepository.getNextLot.mockResolvedValue(nextLot);

      await service.placeNextLot(owner);

      expect(lotsService.bulkMarkUnsold).not.toHaveBeenCalled();
      expect(auctionsService.finishAuction).not.toHaveBeenCalled();
      expect(roomRepository.clearRoom).not.toHaveBeenCalled();
    });
  });

  describe('finishAuction', () => {
    beforeEach(() => {
      auctionsService.findOne.mockResolvedValue({ status: AuctionStatus.STARTED });
      stubFinishActiveLot();
      lotsService.bulkMarkUnsold.mockResolvedValue(undefined);
      auctionsService.finishAuction.mockResolvedValue(undefined);
      roomRepository.clearRoom.mockResolvedValue(undefined);
    });

    it('calls bulkMarkUnsold then finishAuction then clearRoom', async () => {
      await service.finishAuction(owner);

      expect(lotsService.bulkMarkUnsold).toHaveBeenCalledWith('auction-1');
      expect(auctionsService.finishAuction).toHaveBeenCalledWith('auction-1');
      expect(roomRepository.clearRoom).toHaveBeenCalledWith('auction-1');
    });

    it('calls clearRoom after auctionsService.finishAuction', async () => {
      await service.finishAuction(owner);

      const finishOrder = auctionsService.finishAuction.mock.invocationCallOrder[0];
      const clearOrder = roomRepository.clearRoom.mock.invocationCallOrder[0];
      expect(clearOrder).toBeGreaterThan(finishOrder);
    });

    it('rejects with NotFoundException and does not call bulkMarkUnsold when room does not exist', async () => {
      roomRepository.getRoom.mockResolvedValue(null);

      await expect(service.finishAuction(owner)).rejects.toThrow(NotFoundException);
      expect(lotsService.bulkMarkUnsold).not.toHaveBeenCalled();
    });
  });

  describe('completeAuction', () => {
    // completeAuction is private — exercised via the placeNextLot auto-finish path (no next lot)

    beforeEach(() => {
      stubFinishActiveLot();
      roomRepository.getNextLot.mockResolvedValue(undefined);
      roomRepository.setActiveLot.mockResolvedValue(undefined);
      lotsService.bulkMarkUnsold.mockResolvedValue(undefined);
      auctionsService.finishAuction.mockResolvedValue(undefined);
      roomRepository.clearRoom.mockResolvedValue(undefined);
    });

    it('calls bulkMarkUnsold with the auction id from the room', async () => {
      await service.placeNextLot(owner);

      expect(lotsService.bulkMarkUnsold).toHaveBeenCalledWith(owner.auctionId);
    });

    it('calls markAsFinished (auctionsService.finishAuction) with the auction id from the room', async () => {
      await service.placeNextLot(owner);

      expect(auctionsService.finishAuction).toHaveBeenCalledWith(owner.auctionId);
    });

    it('calls clearRoom with the auction id', async () => {
      await service.placeNextLot(owner);

      expect(roomRepository.clearRoom).toHaveBeenCalledWith(owner.auctionId);
    });

    // "does not call bulkMarkUnsold or markAsFinished when room is null" is not applicable:
    // completeAuction is unconditional. The null-room guard lives in finishActiveLot (throws
    // NotFoundException). That path is covered by finishAuction #3 above.
  });

  describe('restartAuction', () => {
    beforeEach(() => {
      auctionsService.findOne.mockResolvedValue({ status: AuctionStatus.FINISHED });
      roomRepository.clearRoom.mockResolvedValue(undefined);
      auctionsService.restartAuction.mockResolvedValue(undefined);
    });

    it('calls auctionsService.restartAuction with ownerId and auctionId', async () => {
      await service.restartAuction('user-1', 'auction-1');

      expect(auctionsService.restartAuction).toHaveBeenCalledWith('user-1', 'auction-1');
    });

    it('calls roomRepository.clearRoom with auctionId before auctionsService.restartAuction', async () => {
      await service.restartAuction('user-1', 'auction-1');

      expect(roomRepository.clearRoom).toHaveBeenCalledWith('auction-1');
      const clearOrder = roomRepository.clearRoom.mock.invocationCallOrder[0];
      const restartOrder = auctionsService.restartAuction.mock.invocationCallOrder[0];
      expect(clearOrder).toBeLessThan(restartOrder);
    });

    it('throws BadRequestException when auction status is not FINISHED', async () => {
      auctionsService.findOne.mockResolvedValue({ status: AuctionStatus.CREATED });

      await expect(service.restartAuction('user-1', 'auction-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('succeeds (does not throw) when auction is in STARTED state', async () => {
      // DoD: POST /restart succeeds when auction is in STARTED state
      auctionsService.findOne.mockResolvedValue({ status: AuctionStatus.STARTED });

      await expect(service.restartAuction('user-1', 'auction-1')).resolves.toBeUndefined();
    });
  });

  describe('RoomRepository.roomExists', () => {
    let repo: RoomRepository;

    beforeEach(() => {
      const mockAppConfig = { jwt: { JWT_ROOM_TTL: 3600 } } as any;
      const mockRedisService = {
        createSimpleRepository: jest.fn().mockReturnValue({
          get: jest.fn(),
          set: jest.fn(),
          clear: jest.fn(),
        }),
        createHashRepository: jest.fn().mockReturnValue({
          getList: jest.fn(),
          set: jest.fn(),
          delOne: jest.fn(),
          clear: jest.fn(),
        }),
        createListRepository: jest.fn().mockReturnValue({
          getAll: jest.fn(),
          pushMultiple: jest.fn(),
          push: jest.fn(),
          clear: jest.fn(),
        }),
      } as any;
      repo = new RoomRepository(mockAppConfig, mockRedisService);
    });

    it('returns true when a room exists for the given auctionId', async () => {
      jest.spyOn(repo, 'getRoom').mockResolvedValue(mockRoom as any);

      expect(await repo.roomExists('auction-1')).toBe(true);
    });

    it('returns false when no room exists for the given auctionId', async () => {
      jest.spyOn(repo, 'getRoom').mockResolvedValue(null);

      expect(await repo.roomExists('auction-1')).toBe(false);
    });
  });
});
