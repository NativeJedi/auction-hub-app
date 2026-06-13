import { z } from 'zod';

const configSchema = z.object({
  API_URL: z.string().nonempty(),
  REDIS_URL: z.string().nonempty(),
  JWT_ACCESS_TTL: z.coerce.number().int().positive(),
  JWT_REFRESH_TTL: z.coerce.number().int().positive(),
});

export type AppServerConfigType = z.infer<typeof configSchema>;

let cached: AppServerConfigType | null = null;

// Validate + memoize on first call. Because this runs lazily (at runtime, when
// a server handler actually needs config) and not at module import, `next build`
// can evaluate the module graph without the runtime env being present.
export const getServerConfig = (): AppServerConfigType => {
  if (!cached) {
    cached = configSchema.parse({
      API_URL: process.env.API_URL,
      REDIS_URL: process.env.REDIS_URL,
      JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL,
      JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL,
    });
  }
  return cached;
};
