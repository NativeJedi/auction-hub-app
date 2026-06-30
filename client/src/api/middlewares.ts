import { NextResponse } from 'next/server';
import { ApiError } from './errors';
import { ErrorServerResponse, QueryParams, ServerResponse } from '@/src/api/types';
import { isObjectWithProperty, isString } from '@/src/utils/checkers';

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler = (req: Request, ctx: RouteContext) => Promise<ServerResponse<unknown>>;

function buildQueryString(params?: QueryParams) {
  if (!params) return '';
  const search = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  );
  const queryString = search.toString();
  return queryString ? `?${queryString}` : '';
}

const normalizeResponseError = async (response: Response): Promise<ErrorServerResponse> => {
  const data = await response.json().catch(() => null);

  let message = 'Unknown error';

  if (isObjectWithProperty(data, 'message')) {
    if (Array.isArray(data.message)) {
      message = data.message.join(', ');
    } else if (isString(data.message)) {
      message = data.message;
    }
  }

  return {
    status: response.status,
    message,
    reason:
      isObjectWithProperty(data, 'reason') && isString(data.reason)
        ? data.reason
        : response.statusText,
  };
};

function withNextErrorResponse(handler: RouteHandler) {
  return async (req: Request, ctx: RouteContext): Promise<NextResponse> => {
    try {
      const result = await handler(req, ctx);
      if ('data' in result) return NextResponse.json(result.data);
      return NextResponse.json(
        { message: result.message, reason: result.reason },
        { status: result.status }
      );
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { message: error.message, reason: error.reason },
          { status: error.status }
        );
      }
      console.error('Unhandled route error:', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  };
}

const redirectOnUnauthorized = (status: number | undefined) => {
  if (
    status === 401 &&
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/crm/auth')
  ) {
    window.location.href = `/crm/auth?from=${encodeURIComponent(window.location.pathname)}`;
  }
};

export { withNextErrorResponse, buildQueryString, normalizeResponseError, redirectOnUnauthorized };
