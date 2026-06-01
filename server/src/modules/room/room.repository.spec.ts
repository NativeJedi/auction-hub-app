import { RoomRepository } from './room.repository';
import { AppConfigService } from '../../config/app-config.service';
import { RedisService } from '../redis/redis.service';
import { Bid } from './entities/bid.entity';

const makeBid = (amount: number, id = `bid-${amount}`): Bid => ({
  id,
  userId: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  amount,
});

const makeRepo = (): RoomRepository => {
  const appConfig = {
    jwt: { JWT_ROOM_TTL: 3600 },
  } as unknown as AppConfigService;

  const redisService = {
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
  } as unknown as RedisService;

  return new RoomRepository(appConfig, redisService);
};

describe('RoomRepository', () => {
  describe('getActiveLotCurrentBid', () => {
    it('returns the highest bid (bids[0]) when multiple ascending bids exist', async () => {
      // Bids are stored with LPUSH, so the most recent (highest) is at index 0.
      // The list represents [300, 200, 100] — newest first.
      const repo = makeRepo();
      const bids: Bid[] = [makeBid(300), makeBid(200), makeBid(100)];
      jest.spyOn(repo, 'getActiveLotBids').mockResolvedValue(bids);

      const result = await repo.getActiveLotCurrentBid('auction-1');

      expect(result).toEqual(makeBid(300));
    });

    it('returns the single bid when exactly one bid exists', async () => {
      const repo = makeRepo();
      const bids: Bid[] = [makeBid(150)];
      jest.spyOn(repo, 'getActiveLotBids').mockResolvedValue(bids);

      const result = await repo.getActiveLotCurrentBid('auction-1');

      expect(result).toEqual(makeBid(150));
    });

    it('returns undefined when no bids exist for the active lot', async () => {
      const repo = makeRepo();
      jest.spyOn(repo, 'getActiveLotBids').mockResolvedValue([]);

      const result = await repo.getActiveLotCurrentBid('auction-1');

      expect(result).toBeUndefined();
    });
  });

  describe('getLotCurrentBid', () => {
    it('returns bids[0] (most recent) when multiple bids exist for a lot', async () => {
      const repo = makeRepo();
      const bids: Bid[] = [makeBid(500), makeBid(250)];
      jest.spyOn(repo, 'getLotBids').mockResolvedValue(bids);

      const result = await repo.getLotCurrentBid('auction-1', 'lot-1');

      expect(result).toEqual(makeBid(500));
    });

    it('returns undefined when the lot has no bids', async () => {
      const repo = makeRepo();
      jest.spyOn(repo, 'getLotBids').mockResolvedValue([]);

      const result = await repo.getLotCurrentBid('auction-1', 'lot-1');

      expect(result).toBeUndefined();
    });
  });
});
