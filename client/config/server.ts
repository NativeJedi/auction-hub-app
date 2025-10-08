import { z } from 'zod';

const configSchema = z.object({
  API_URL: z.string().nonempty(),
});

export const AppServerConfig = configSchema.parse({
  API_URL: process.env.API_URL,
});
