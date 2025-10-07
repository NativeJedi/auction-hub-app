import { AxiosError } from 'axios';
import { ApiError, ApiResponse } from '@/src/api/core/types';
import { isObjectWithProperty } from '@/src/utils/checkers';

export const responseDataInterceptor = (response: ApiResponse) => {
  if (response.config.fullResponse) {
    return response;
  }

  return response.data;
};

export const responseApiErrorInterceptor = (error: AxiosError) => {
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
