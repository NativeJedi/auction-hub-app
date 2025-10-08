import * as process from 'node:process';
import 'dotenv/config';

interface AppConfigInterface {
  ENV: string;

  // env urls
  DATABASE_URL: string;
  REDIS_URL: string;
  PORT: number | string;
  CLIENT_URL: string;

  // token secrets
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET: string;
  JWT_ROOM_MEMBER_TOKEN_SECRET: string;

  // ttls
  JWT_ROOM_MEMBER_INVITE_TOKEN_TTL: number;
  JWT_ROOM_TTL: number;
  JWT_ACCESS_TTL: number;
  JWT_REFRESH_TTL: number;

  // email settings
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;
}

const AppConfig: AppConfigInterface = {
  ENV: process.env.NODE_ENV || 'production',

  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  PORT: process.env.PORT || 3000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3001',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access_default',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_default',
  JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET:
    process.env.JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET || 'invite_default',
  JWT_ROOM_MEMBER_TOKEN_SECRET:
    process.env.JWT_ROOM_MEMBER_TOKEN_SECRET || 'member_default',

  JWT_ACCESS_TTL: 60 * 15,
  JWT_REFRESH_TTL: 60 * 60 * 24 * 2, // 2 days in seconds
  JWT_ROOM_MEMBER_INVITE_TOKEN_TTL: 60 * 30,
  JWT_ROOM_TTL: 60 * 60 * 24 * 1,

  EMAIL_HOST: process.env.EMAIL_HOST!,
  EMAIL_PORT: Number(process.env.EMAIL_PORT),
  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD!,
};

export { AppConfig, AppConfigInterface };
