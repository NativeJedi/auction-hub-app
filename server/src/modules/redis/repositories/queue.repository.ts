import { BaseRepository, CombinedKey } from './base.repository';
import { Redis } from 'ioredis';

export class RedisQueueRepository<T> extends BaseRepository {
  constructor(
    private readonly client: Redis,
    baseKey: string,
    private readonly ttlSeconds: number,
  ) {
    super(baseKey);
  }

  async push(key: CombinedKey, ...elements: T[]) {
    const lotStrings = elements.map((lot) => JSON.stringify(lot));

    await this.client.lpush(
      this.getFullKey(key),
      ...lotStrings,
      'EX',
      this.ttlSeconds,
    );
  }

  async pop(key: CombinedKey): Promise<T | null> {
    const stringValue = await this.client.lpop(this.getFullKey(key));

    return stringValue ? JSON.parse(stringValue) : null;
  }

  async getAll(key: CombinedKey): Promise<T[]> {
    const stringValues = await this.client.lrange(this.getFullKey(key), 0, -1);

    const values: T[] = stringValues.map((string) => JSON.parse(string));

    return values;
  }
}
