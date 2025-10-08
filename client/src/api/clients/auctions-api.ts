import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { cookies } from 'next/headers';
import { TypedAxiosInstance } from '@/src/api/core/types';
import { responseDataInterceptor } from '@/src/api/core/interceptors';
import { isApiExpiredTokenError, TokenExpiredError } from '@/src/utils/errors';
import { AppServerConfig } from '@/config/server';

const auctionsAPI: TypedAxiosInstance = axios.create({
  baseURL: AppServerConfig.API_URL,
});

const requestCookieAuthInterceptor = async (config: InternalAxiosRequestConfig) => {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('accessToken')?.value;

  if (accessToken && config.headers) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return config;
};

auctionsAPI.interceptors.request.use(requestCookieAuthInterceptor);

auctionsAPI.interceptors.response.use(responseDataInterceptor, (error: AxiosError) => {
  if (isApiExpiredTokenError(error)) {
    return Promise.reject(new TokenExpiredError(error));
  }

  return Promise.reject(error);
});

export { auctionsAPI };
