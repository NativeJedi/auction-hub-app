import { cookies, headers } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';
import { sessionStorage } from '@/src/services/session';
import {
  ErrorResponseInterceptor,
  RequestInterceptor,
  SuccessResponseInterceptor,
} from '@/src/api/core/factory';
import { AuctionsApiCustomConfigProps } from '@/src/api/auctions-api/types';
import { UnauthorizedError } from '@/src/utils/errors';

// Forward the real client IP to the api so its rate-limiter sees the actual
// visitor instead of the client container. Cloudflare provides it in
// `CF-Connecting-IP`; falls back to standard proxy headers off Cloudflare
// (e.g. local dev). Runs for every request, including skipAuth auth calls.
export const forwardClientIpInterceptor: RequestInterceptor = async (config) => {
  const headerStore = await headers();
  const realIp =
    headerStore.get('cf-connecting-ip') ??
    headerStore.get('x-real-ip') ??
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim();

  if (realIp && config.headers) {
    config.headers['X-Forwarded-For'] = realIp;
  }

  return config;
};

export const authRequestInterceptor: RequestInterceptor<AuctionsApiCustomConfigProps> = async (
  config
) => {
  if (config?.skipAuth) {
    return config;
  }

  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    throw new UnauthorizedError();
  }

  const session = await sessionStorage.getValidSession(sessionId);

  if (!session) {
    throw new UnauthorizedError();
  }

  if (config.headers) {
    config.headers['Authorization'] = `Bearer ${session.accessToken}`;
  }

  return config;
};

export const dataResponseInterceptor: SuccessResponseInterceptor = (response) => response.data;

export const errorResponseInterceptor: ErrorResponseInterceptor = (error) => {
  return Promise.reject(error);
};
