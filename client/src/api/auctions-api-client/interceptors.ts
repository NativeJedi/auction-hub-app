import { isObjectWithProperty } from '@/src/utils/checkers';
import { ErrorResponseInterceptor, SuccessResponseInterceptor } from '@/src/api/core/factory';
import { AuctionsApiClientCustomConfigProps } from '@/src/api/auctions-api-client/types';
import { AxiosError } from 'axios';

export const dataResponseInterceptor: SuccessResponseInterceptor<
  AuctionsApiClientCustomConfigProps
> = (response) => {
  if (response.config.fullResponse) {
    return response;
  }

  return response.data;
};

interface ApiError<T = unknown> extends Error {
  data?: T;
  _originalError?: AxiosError;
  message: string;
}

export const errorResponseInterceptor: ErrorResponseInterceptor = (error) => {
  // Session died while the user was on the page (refresh failed) → BFF returns
  // 401. Bounce to login. Guard against a loop when already on the auth page
  // (e.g. a wrong-credentials 401 during login).
  if (
    error.response?.status === 401 &&
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/crm/auth')
  ) {
    window.location.href = `/crm/auth?from=${encodeURIComponent(window.location.pathname)}`;
  }

  const apiError: ApiError = new Error(error.message);
  apiError._originalError = error;

  if (error.response) {
    const { data } = error.response;

    if (isObjectWithProperty(data, 'message') && Array.isArray(data.message)) {
      apiError.message = data.message.join(', ');
    }

    apiError.data = data;
  }

  return Promise.reject(apiError);
};
