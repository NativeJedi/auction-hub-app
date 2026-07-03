import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { ProxyThrottlerGuard } from './modules/auth/proxy-throttler.guard';
import { AppConfig } from './config/app.config';
import { LoggerConfig } from './config/logger.config';
import { TypeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuctionsModule } from './modules/auctions/auctions.module';
import { LotsModule } from './modules/lots/lots.module';
import { RoomModule } from './modules/room/room.module';
import { BuyersModule } from './modules/buyers/buyers.module';
import { StorageModule } from './modules/storage/storage.module';

export const APP_MODULES = [
  RedisModule,
  AuthModule,
  AuctionsModule,
  LotsModule,
  RoomModule,
  BuyersModule,
];

@Module({
  imports: [
    // Structured logging (pino). Must be first so request logging middleware
    // is registered before anything else handles the request.
    LoggerModule.forRoot(LoggerConfig),
    ...APP_MODULES,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => AppConfig],
    }),
    TypeOrmModule.forRoot(TypeOrmConfig),
    StorageModule,
    // Global rate limit (generous backstop against floods). Per-endpoint
    // overrides via @Throttle (e.g. stricter on auth). Counted per real client
    // IP through ProxyThrottlerGuard (X-Forwarded-For forwarded by the BFF).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ProxyThrottlerGuard }],
})
export class AppModule {}
