import axios from 'axios';
import { TypedAxiosInstance } from '@/src/api/core/types';
import { responseApiErrorInterceptor, responseDataInterceptor } from '@/src/api/core/interceptors';
import { responseRefreshTokenInterceptor } from '@/src/api/core/refreshTokenInterceptor';

const BASE_URL = '/api';

const apiClient: TypedAxiosInstance = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.response.use(responseDataInterceptor, responseRefreshTokenInterceptor);
apiClient.interceptors.response.use(undefined, responseApiErrorInterceptor);

export { apiClient };
