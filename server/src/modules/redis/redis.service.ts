import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfigService } from '../../config/app-config.service';
import { RedisSimpleRepository } from './repositories/simple.repository';
import { RedisQueueRepository } from './repositories/queue.repository';
import { RedisHashRepository } from './repositories/hash.repository';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly appConfig: AppConfigService) {
    this.client = new Redis(this.appConfig.urls.REDIS_URL);
  }

  async onModuleDestroy() {
    await this.client.quit();

    this.logger.log('Redis disconnected');
  }

  createHashRepository<T>(
    key: string,
    ttlSeconds: number,
  ): RedisHashRepository<T> {
    return new RedisHashRepository<T>(this.client, key, ttlSeconds);
  }

  createSimpleRepository<T>(
    key: string,
    ttlSeconds: number,
  ): RedisSimpleRepository<T> {
    return new RedisSimpleRepository<T>(this.client, key, ttlSeconds);
  }

  createQueueRepository<T>(
    key: string,
    ttlSeconds: number,
  ): RedisQueueRepository<T> {
    return new RedisQueueRepository<T>(this.client, key, ttlSeconds);
  }

  getClient() {
    return this.client;
  }
}
