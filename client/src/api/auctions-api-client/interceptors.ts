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
