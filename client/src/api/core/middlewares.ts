import { NextResponse } from 'next/server';

function withNextErrorResponse(handler: (req: Request, options?: any) => Promise<unknown>) {
  return async (req: Request, options?: any) => {
    try {
      return await handler(req, options);
    } catch (error: any) {
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
