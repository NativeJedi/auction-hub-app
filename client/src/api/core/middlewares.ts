import { NextResponse } from 'next/server';
import { isUnauthorizedError } from '@/src/utils/errors';

function withNextErrorResponse(handler: (req: Request, options?: any) => Promise<NextResponse>) {
  return async (req: Request, options?: any): Promise<NextResponse> => {
    try {
      return await handler(req, options);
    } catch (error: any) {
      // Invalid/expired session (thrown by the auth request interceptor) has no
      // upstream response — map it to a real 401 so the browser client can
      // detect it and redirect to login.
      if (isUnauthorizedError(error)) {
        return NextResponse.json({ message: error.message, code: error.code }, { status: 401 });
      }

      if (error.response) {
        return NextResponse.json(error.response.data || { message: error.message }, {
          status: error.response.status,
        });
      }

      // TODO: Add logging
      console.error('Unknown error:', error.message);

      return NextResponse.json(
        { message: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export { withNextErrorResponse };
