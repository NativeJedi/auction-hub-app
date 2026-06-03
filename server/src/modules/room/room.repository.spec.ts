import { ConflictException, NotFoundException } from '@nestjs/common';
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

const makeMember = () => ({
  id: 'm-1',
  name: 'Alice',
  email: 'alice@example.com',
});

const makeRepo = () => {
  const appConfig = {
    jwt: { JWT_ROOM_TTL: 3600 },
  } as unknown as AppConfigService;

  // Identity getFullKey keeps key assertions readable in tests.
  const simple = {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    getFullKey: jest.fn((key: string) => key),
  };
  const hash = {
    getList: jest.fn(),
    set: jest.fn(),
    delOne: jest.fn(),
    clear: jest.fn(),
  };
  const list = {
    getAll: jest.fn(),
    pushMultiple: jest.fn(),
    push: jest.fn(),
    clear: jest.fn(),
  };
  const sortedSet = {
    add: jest.fn(),
    getAllDesc: jest.fn(),
    clear: jest.fn(),
  };
  const client = { set: jest.fn() };

  const redisService = {
    createSimpleRepository: jest.fn().mockReturnValue(simple),
    createHashRepository: jest.fn().mockReturnValue(hash),
    createListRepository: jest.fn().mockReturnValue(list),
    createSortedSetRepository: jest.fn().mockReturnValue(sortedSet),
    getClient: jest.fn().mockReturnValue(client),
  } as unknown as RedisService;

  const repo = new RoomRepository(appConfig, redisService);

  return { repo, simple, hash, list, sortedSet, client };
};

describe('RoomRepository', () => {
  describe('getActiveLotCurrentBid', () => {
    it('returns the highest bid (bids[0]) when multiple bids exist', async () => {
      // getActiveLotBids reads the sorted set descending (ZREVRANGE), so the
      // highest bid is at index 0. The collection represents [300, 200, 100].
      const { repo } = makeRepo();
      const bids: Bid[] = [makeBid(300), makeBid(200), makeBid(100)];
      jest.spyOn(repo, 'getActiveLotBids').mockResolvedValue(bids);

      const result = await repo.getActiveLotCurrentBid('auction-1');

      expect(result).toEqual(makeBid(300));
    });

    it('returns the single bid when exactly one bid exists', async () => {
      const { repo } = makeRepo();
      const bids: Bid[] = [makeBid(150)];
      jest.spyOn(repo, 'getActiveLotBids').mockResolvedValue(bids);

      const result = await repo.getActiveLotCurrentBid('auction-1');

      expect(result).toEqual(makeBid(150));
    });

    it('returns undefined when no bids exist for the active lot', async () => {
      const { repo } = makeRepo();
      jest.spyOn(repo, 'getActiveLotBids').mockResolvedValue([]);

      const result = await repo.getActiveLotCurrentBid('auction-1');

      expect(result).toBeUndefined();
    });
  });

  describe('getLotCurrentBid', () => {
    it('returns bids[0] (highest) when multiple bids exist for a lot', async () => {
      const { repo } = makeRepo();
      const bids: Bid[] = [makeBid(500), makeBid(250)];
      jest.spyOn(repo, 'getLotBids').mockResolvedValue(bids);

      const result = await repo.getLotCurrentBid('auction-1', 'lot-1');

      expect(result).toEqual(makeBid(500));
    });

    it('returns undefined when the lot has no bids', async () => {
      const { repo } = makeRepo();
      jest.spyOn(repo, 'getLotBids').mockResolvedValue([]);

      const result = await repo.getLotCurrentBid('auction-1', 'lot-1');

      expect(result).toBeUndefined();
    });
  });

  describe('setBid', () => {
    it('stores the absolute amount sent by the client (no server-side derivation)', async () => {
      const { repo, sortedSet } = makeRepo();
      jest
        .spyOn(repo, 'getActiveLot')
        .mockResolvedValue({ id: 'lot-1', startPrice: 100 } as never);

      const result = await repo.setBid('auction-1', makeMember(), {
        lotId: 'lot-1',
        amount: 1500,
      });

      expect(result.amount).toBe(1500);
      expect(sortedSet.add).toHaveBeenCalledWith(
        'bids:auction-1:lot-1',
        expect.objectContaining({ amount: 1500, userId: 'm-1' }),
        1500,
      );
    });

    it('scores the sorted-set entry by the bid amount', async () => {
      const { repo, sortedSet } = makeRepo();
      jest
        .spyOn(repo, 'getActiveLot')
        .mockResolvedValue({ id: 'lot-1', startPrice: 100 } as never);

      await repo.setBid('auction-1', makeMember(), {
        lotId: 'lot-1',
        amount: 1500,
      });

      expect(sortedSet.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        1500,
      );
    });

    it('throws NotFoundException when there is no active lot', async () => {
      const { repo } = makeRepo();
      jest.spyOn(repo, 'getActiveLot').mockResolvedValue(undefined);

      await expect(
        repo.setBid('auction-1', makeMember(), { lotId: 'lot-1', amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when bid.lotId does not match the active lot', async () => {
      const { repo } = makeRepo();
      jest
        .spyOn(repo, 'getActiveLot')
        .mockResolvedValue({ id: 'lot-1', startPrice: 100 } as never);

      await expect(
        repo.setBid('auction-1', makeMember(), { lotId: 'lot-2', amount: 100 }),
      ).rejects.toThrow(ConflictException);
    });

    it('records both of two concurrent valid bids (no lost bid)', async () => {
      const { repo, sortedSet } = makeRepo();
      jest
        .spyOn(repo, 'getActiveLot')
        .mockResolvedValue({ id: 'lot-1', startPrice: 100 } as never);

      await Promise.all([
        repo.setBid('auction-1', makeMember(), {
          lotId: 'lot-1',
          amount: 1500,
        }),
        repo.setBid('auction-1', makeMember(), {
          lotId: 'lot-1',
          amount: 1500,
        }),
      ]);

      expect(sortedSet.add).toHaveBeenCalledTimes(2);
    });
  });

  describe('getLotBids', () => {
    it('returns bids highest-amount-first (sorted-set descending read)', async () => {
      const { repo, sortedSet } = makeRepo();
      const bids: Bid[] = [makeBid(300), makeBid(200), makeBid(100)];
      sortedSet.getAllDesc.mockResolvedValue(bids);

      const result = await repo.getLotBids('auction-1', 'lot-1');

      expect(sortedSet.getAllDesc).toHaveBeenCalledWith('bids:auction-1:lot-1');
      expect(result).toEqual(bids);
    });
  });

  describe('createRoom', () => {
    const lots = [{ id: 'lot-1' }] as never;

    it('creates the room with SET NX and returns it when no room exists', async () => {
      const { repo, client, list, simple } = makeRepo();
      client.set.mockResolvedValue('OK');

      const result = await repo.createRoom(
        'owner-1',
        'auction-1',
        { name: 'A' } as never,
        lots,
      );

      expect(result).toMatchObject({
        auctionId: 'auction-1',
        ownerId: 'owner-1',
      });
      expect(client.set).toHaveBeenCalledWith(
        'room:auction-1',
        expect.any(String),
        'EX',
        3600,
        'NX',
      );
      expect(simple.set).toHaveBeenCalledWith('room:auction-1', 'lot-1');
      expect(list.pushMultiple).toHaveBeenCalledWith('room:auction-1', lots);
    });

    it('throws ConflictException("Room already exists") when SET NX returns null', async () => {
      const { repo, client } = makeRepo();
      client.set.mockResolvedValue(null);

      await expect(
        repo.createRoom('owner-1', 'auction-1', {} as never, lots),
      ).rejects.toThrow(ConflictException);
    });

    it('does not set the active lot or push lots when the room already exists', async () => {
      const { repo, client, simple, list } = makeRepo();
      client.set.mockResolvedValue(null);

      await expect(
        repo.createRoom('owner-1', 'auction-1', {} as never, lots),
      ).rejects.toThrow(ConflictException);

      expect(simple.set).not.toHaveBeenCalled();
      expect(list.pushMultiple).not.toHaveBeenCalled();
    });
  });
});
