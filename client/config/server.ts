import { z } from 'zod';

const configSchema = z.object({
  API_URL: z.string().nonempty(),
  REDIS_URL: z.string().nonempty(),
  JWT_ACCESS_TTL: z.coerce.number().int().positive(),
  JWT_REFRESH_TTL: z.coerce.number().int().positive(),
});

export const AppServerConfig = configSchema.parse({
  API_URL: process.env.API_URL,
  REDIS_URL: process.env.REDIS_URL,
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL,
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL,
});
