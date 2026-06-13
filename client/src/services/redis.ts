import Redis from 'ioredis';
import { getServerConfig } from '@/config/server';

let client: Redis | null = null;

// Lazy singleton: the ioredis client (and reading REDIS_URL) happens on first
// use at runtime, not at import time — so `next build` doesn't need REDIS_URL
// and no socket is opened during the build.
export const getRedis = (): Redis => {
  if (!client) {
    client = new Redis(getServerConfig().REDIS_URL, { lazyConnect: true });
  }
  return client;
};
