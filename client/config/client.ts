import { z } from 'zod';

const configSchema = z.object({
  NEXT_PUBLIC_API_WEBSOCKET_URL: z.string().nonempty(),
});

export const AppClientConfig = configSchema.parse({
  NEXT_PUBLIC_API_WEBSOCKET_URL: process.env.NEXT_PUBLIC_API_WEBSOCKET_URL,
});
