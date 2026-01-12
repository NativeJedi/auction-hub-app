import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';
import { sessionStorage } from '@/src/services/session';
import {
  ErrorResponseInterceptor,
  RequestInterceptor,
  SuccessResponseInterceptor,
} from '@/src/api/core/factory';
import { AuctionsApiCustomConfigProps } from '@/src/api/auctions-api/types';
import { UnauthorizedError } from '@/src/utils/errors';

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
