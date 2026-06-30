import { withNextErrorResponse } from '@/src/api/middlewares';
import { fetchGoogleNonceServer } from '@/src/api/requests/auth';

export const GET = withNextErrorResponse(async () => {
  return fetchGoogleNonceServer();
});
