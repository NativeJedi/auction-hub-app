import { BaseRepository, CombinedKey } from './base.repository';
import { Redis } from 'ioredis';

export class RedisSortedSetRepository<T> extends BaseRepository {
  constructor(
    private readonly client: Redis,
    baseKey: string,
    private readonly ttlSeconds: number,
  ) {
    super(baseKey);
  }

  async add(key: CombinedKey, item: T, score: number) {
    const fullKey = this.getFullKey(key);
    await this.client.zadd(fullKey, score, JSON.stringify(item));
    await this.client.expire(fullKey, this.ttlSeconds);
  }

  // Highest score first.
  async getAllDesc(key: CombinedKey): Promise<T[]> {
    const fullKey = this.getFullKey(key);
    const rawList = await this.client.zrevrange(fullKey, 0, -1);
    return rawList.map((item) => JSON.parse(item) as T);
  }

  async clear(key: CombinedKey) {
    return this.client.del(this.getFullKey(key));
  }
}
