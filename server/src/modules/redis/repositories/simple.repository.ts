import { Redis } from 'ioredis';
import { BaseRepository, CombinedKey } from './base.repository';

export class RedisSimpleRepository<T> extends BaseRepository {
  constructor(
    private readonly client: Redis,
    baseKey: string,
    private readonly ttlSeconds: number,
  ) {
    super(baseKey);
  }

  async get(key: CombinedKey) {
    const entity = await this.client.get(this.getFullKey(key));

    return entity ? (JSON.parse(entity) as T) : null;
  }

  set(key: CombinedKey, entity: T) {
    return this.client.set(
      this.getFullKey(key),
      JSON.stringify(entity),
      'EX',
      this.ttlSeconds,
    );
  }

  del(key: CombinedKey) {
    return this.client.del(this.getFullKey(key));
  }
}
