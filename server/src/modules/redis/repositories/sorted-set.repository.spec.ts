import { RedisSortedSetRepository } from './sorted-set.repository';
import { Redis } from 'ioredis';

const makeRepo = () => {
  const client = {
    zadd: jest.fn(),
    expire: jest.fn(),
    zrevrange: jest.fn(),
    del: jest.fn(),
  };

  const repo = new RedisSortedSetRepository<{ amount: number }>(
    client as unknown as Redis,
    'bids',
    3600,
  );

  return { repo, client };
};

describe('RedisSortedSetRepository', () => {
  describe('add', () => {
    it('ZADDs the serialized item scored by the given score', async () => {
      const { repo, client } = makeRepo();
      const item = { amount: 150 };

      await repo.add('lot-1', item, 150);

      expect(client.zadd).toHaveBeenCalledWith(
        'bids:lot-1',
        150,
        JSON.stringify(item),
      );
    });

    it('refreshes the key TTL with expire', async () => {
      const { repo, client } = makeRepo();

      await repo.add('lot-1', { amount: 150 }, 150);

      expect(client.expire).toHaveBeenCalledWith('bids:lot-1', 3600);
    });
  });

  describe('getAllDesc', () => {
    it('returns parsed items ordered by highest score first (ZREVRANGE)', async () => {
      const { repo, client } = makeRepo();
      client.zrevrange.mockResolvedValue([
        JSON.stringify({ amount: 300 }),
        JSON.stringify({ amount: 100 }),
      ]);

      const result = await repo.getAllDesc('lot-1');

      expect(client.zrevrange).toHaveBeenCalledWith('bids:lot-1', 0, -1);
      expect(result).toEqual([{ amount: 300 }, { amount: 100 }]);
    });

    it('returns an empty array when the key is empty', async () => {
      const { repo, client } = makeRepo();
      client.zrevrange.mockResolvedValue([]);

      const result = await repo.getAllDesc('lot-1');

      expect(result).toEqual([]);
    });
  });

  describe('clear', () => {
    it('deletes the key', async () => {
      const { repo, client } = makeRepo();

      await repo.clear('lot-1');

      expect(client.del).toHaveBeenCalledWith('bids:lot-1');
    });
  });
});
