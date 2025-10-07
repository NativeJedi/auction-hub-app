import { AxiosError } from 'axios';
import { isApiExpiredTokenError } from '@/src/utils/errors';
import { refreshToken } from '@/src/api/requests/browser/auth';
import { apiClient } from '@/src/api/clients/api-client';

export const responseRefreshTokenInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config;

  if (!originalRequest || !isApiExpiredTokenError(error)) {
    return Promise.reject(error);
  }

  if (!window.refreshingPromise) {
    window.refreshingPromise = refreshToken().finally(() => {
      delete window.refreshingPromise;
    });
  }

  return window.refreshingPromise.then(() => {
    return apiClient(originalRequest);
  });
};
