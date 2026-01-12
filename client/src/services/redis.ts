import Redis from 'ioredis';
import { AppServerConfig } from '@/config/server';

export const redis = new Redis(AppServerConfig.REDIS_URL);
