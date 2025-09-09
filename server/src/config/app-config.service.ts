import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigInterface } from '../config/app.config';
import process from 'node:process';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<AppConfigInterface>) {}

  get jwt() {
    const JWT_ACCESS_TTL = this.config.get<number>('JWT_ACCESS_TTL')!;
    const JWT_REFRESH_TTL = this.config.get<number>('JWT_REFRESH_TTL')!;
    const JWT_ACCESS_SECRET = this.config.get<string>('JWT_ACCESS_SECRET')!;
    const JWT_REFRESH_SECRET = this.config.get<string>('JWT_REFRESH_SECRET')!;
    const JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET = this.config.get<string>(
      'JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET',
    )!;
    const JWT_ROOM_MEMBER_INVITE_TOKEN_TTL = this.config.get<number>(
      'JWT_ROOM_MEMBER_INVITE_TOKEN_TTL',
    )!;
    const JWT_ROOM_MEMBER_TOKEN_SECRET = this.config.get<string>(
      'JWT_ROOM_MEMBER_TOKEN_SECRET',
    )!;
    const JWT_ROOM_TTL = this.config.get<number>('JWT_ROOM_TTL')!;

    return {
      JWT_ACCESS_TTL,
      JWT_REFRESH_TTL,
      JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET,
      JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET,
      JWT_ROOM_MEMBER_INVITE_TOKEN_TTL,
      JWT_ROOM_MEMBER_TOKEN_SECRET,
      JWT_ROOM_TTL,
    };
  }

  get urls() {
    const DATABASE_URL = this.config.get<string>('DATABASE_URL')!;
    const REDIS_URL = this.config.get<string>('REDIS_URL')!;

    return {
      DATABASE_URL,
      REDIS_URL,
    };
  }

  get emailSettings() {
    const EMAIL_HOST = this.config.get<string>('EMAIL_HOST')!;
    const EMAIL_PORT = this.config.get<number>('EMAIL_PORT')!;
    const EMAIL_USER = this.config.get<string>('EMAIL_USER')!;
    const EMAIL_PASSWORD = this.config.get<string>('EMAIL_PASSWORD')!;

    return {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASSWORD,
    };
  }
}
