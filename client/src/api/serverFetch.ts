import { getServerConfig } from '@/config/server';
import { ServerResponse, SuccessServerResponse } from './types';
import { createServerRequestHeaders } from './headers';
import { buildQueryString, normalizeResponseError } from '@/src/api/middlewares';

type ServerFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  skipAuth?: boolean;
  params?: Record<string, string | number>;
  cache?: RequestCache;
  tags?: string[];
  headers?: Record<string, string>;
};

// Single server-side gateway to the backend. Resolves the base URL, forwards
// the real client IP, attaches the session Bearer token, and returns the
// HTTP-shaped { status, data } contract — the same shape `withNextErrorResponse`
// produces, so the client normalizes both paths the same way.
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<ServerResponse<T>> {
  const { method = 'GET', body, skipAuth = false, params, cache = 'no-store', tags } = options;

  const requestHeaders = await createServerRequestHeaders(skipAuth);

  if (options.headers) {
    Object.assign(requestHeaders, options.headers);
  }

  if (!skipAuth && !requestHeaders['Authorization']) {
    return {
      status: 401,
      message: 'User is not authorized',
      reason: 'UNAUTHORIZED',
    };
  }

  const url = `${getServerConfig().API_URL}${path}${buildQueryString(params)}`;

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache,
    next: tags ? { tags } : undefined,
  });

  if (!response.ok) {
    return normalizeResponseError(response);
  }

  const payload: T = await response.json().catch(() => null);

  const nextResponse: SuccessServerResponse<T> = { status: response.status, data: payload };

  return nextResponse;
}
