import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from './config/app.config';
import { TypeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuctionsModule } from './modules/auctions/auctions.module';
import { LotsModule } from './modules/lots/lots.module';
import { RoomModule } from './modules/room/room.module';

@Module({
  imports: [
    RedisModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => AppConfig],
    }),
    TypeOrmModule.forRoot(TypeOrmConfig),
    AuctionsModule,
    LotsModule,
    RoomModule,
  ],
})
export class AppModule {}
