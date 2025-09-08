import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;

  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly appConfig: AppConfigService) {
    this.client = new Redis(this.appConfig.urls.REDIS_URL);
  }

  async onModuleInit() {
    await this.client.connect();
    this.logger.log('Redis connected');
  }

  async onModuleDestroy() {
    await this.client.quit();

    this.logger.log('Redis disconnected');
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }

    return this.client.set(key, value);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  getClient() {
    return this.client;
  }
}
