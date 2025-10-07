import { BaseRepository, CombinedKey } from './base.repository';
import { Redis } from 'ioredis';

export class RedisListRepository<T> extends BaseRepository {
  constructor(
    private readonly client: Redis,
    baseKey: string,
    private readonly ttlSeconds: number,
  ) {
    super(baseKey);
  }

  async push(key: CombinedKey, item: T) {
    const fullKey = this.getFullKey(key);
    await this.client.rpush(fullKey, JSON.stringify(item));
    await this.client.expire(fullKey, this.ttlSeconds);
  }

  async pushMultiple(key: CombinedKey, items: T[]) {
    if (!items.length) return;

    const fullKey = this.getFullKey(key);

    const serializedItems = items.map((item) => JSON.stringify(item));

    await this.client.rpush(fullKey, ...serializedItems);

    await this.client.expire(fullKey, this.ttlSeconds);
  }

  async getAll(key: CombinedKey): Promise<T[]> {
    const fullKey = this.getFullKey(key);
    const rawList = await this.client.lrange(fullKey, 0, -1);
    return rawList.map((item) => JSON.parse(item));
  }

  async clear(key: CombinedKey) {
    return this.client.del(this.getFullKey(key));
  }
}
