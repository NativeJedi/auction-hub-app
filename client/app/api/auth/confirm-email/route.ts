import { withNextErrorResponse } from '@/src/api/middlewares';
import { confirmEmailServer } from '@/src/api/requests/auth';

export const GET = withNextErrorResponse(async (req) => {
  const code = new URL(req.url).searchParams.get('code');
  if (!code) {
    return { status: 400, message: 'Missing code parameter', reason: 'BAD_REQUEST' };
  }
  return confirmEmailServer(code);
});
