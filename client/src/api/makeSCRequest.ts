import { isServerErrorResponse, ServerResponse } from '@/src/api/types';
import { notFound, redirect } from 'next/navigation';
import { ApiError } from '@/src/api/errors';

// Wrapper for Server Components requests that handles 401/404 errors
export const makeSCRequest = <Args extends unknown[], T>(
  request: (...args: Args) => Promise<ServerResponse<T>>
) => {
  return async (...args: Args): Promise<T> => {
    const response = await request(...args);

    if (!isServerErrorResponse(response)) {
      return response.data;
    }

    if (response.status === 401) {
      redirect('/crm/auth');
    }

    if (response.status === 404) {
      notFound();
    }

    throw new ApiError(response);
  };
};
