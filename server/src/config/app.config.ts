import * as process from 'node:process';
import 'dotenv/config';

interface AppConfigInterface {
  DATABASE_URL: string;
  REDIS_URL: string;
  PORT: number | string;
  ENV: string;
  JWT_ACCESS_TTL: string;
  JWT_REFRESH_TTL: number;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
}

const AppConfig: AppConfigInterface = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  PORT: process.env.PORT || 3000,
  ENV: process.env.NODE_ENV || 'production',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: 60 * 60 * 24 * 2, // 2 days in seconds
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'default',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default',
};

export { AppConfig, AppConfigInterface };
