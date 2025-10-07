import { BaseRepository, CombinedKey } from './base.repository';
import { Redis } from 'ioredis';

export class RedisHashRepository<T> extends BaseRepository {
  constructor(
    private readonly client: Redis,
    baseKey: string,
    private readonly ttlSeconds: number,
  ) {
    super(baseKey);
  }

  async set(key: CombinedKey, id: string, item: T) {
    const fullKey = this.getFullKey(key);

    await this.client.hset(fullKey, id, JSON.stringify(item));
    await this.client.expire(fullKey, this.ttlSeconds);
  }

  async get(key: CombinedKey, id: string) {
    const item = await this.client.hget(this.getFullKey(key), id);

    return item ? (JSON.parse(item) as T) : null;
  }

  async delOne(key: CombinedKey, id: string) {
    return this.client.hdel(this.getFullKey(key), id);
  }

  async clear(key: CombinedKey) {
    return this.client.del(this.getFullKey(key));
  }

  async getList(key: CombinedKey) {
    const items = await this.client.hgetall(this.getFullKey(key));

    const itemsList: T[] = Object.values(items).map((item) => JSON.parse(item));

    return itemsList;
  }
}
