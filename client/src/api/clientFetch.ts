import type { QueryParams } from '@/src/api/types';
import {
  buildQueryString,
  normalizeResponseError,
  redirectOnUnauthorized,
} from '@/src/api/middlewares';
import { ApiError } from '@/src/api/errors';

type ClientRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: QueryParams;
};

export async function clientFetch<T>(path: string, options: ClientRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;
  const url = `/api${path}${buildQueryString(params)}`;

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await normalizeResponseError(response);
    redirectOnUnauthorized(error.status);
    throw new ApiError(error);
  }

  const data: T = await response.json().catch(() => null);
  return data;
}
