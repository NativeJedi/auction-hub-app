import  { isServerErrorResponse, ServerResponse } from '@/src/api/types';
import { redirectOnUnauthorized } from '@/src/api/middlewares';
import { ApiError } from '@/src/api/errors';

// Wrapper for Server Actions requests that handles 401 errors
export const makeSARequest = <Args extends unknown[], T>(
  action: (...args: Args) => Promise<ServerResponse<T>>
) => {
  return async (...args: Args): Promise<T> => {
    const response = await action(...args);

    if (isServerErrorResponse(response)) {
      redirectOnUnauthorized(response.status);

      throw new ApiError(response);
    }

    return response.data;
  };
};
