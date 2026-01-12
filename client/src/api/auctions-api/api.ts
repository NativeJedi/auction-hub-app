import { AppServerConfig } from '@/config/server';
import {
  authRequestInterceptor,
  dataResponseInterceptor,
  errorResponseInterceptor,
} from '@/src/api/auctions-api/interceptors';
import { createApiInstance, ResponseInterceptor } from '@/src/api/core/factory';
import { AuctionsApiCustomConfigProps } from '@/src/api/auctions-api/types';

const responseInterceptor: ResponseInterceptor = [
  dataResponseInterceptor,
  errorResponseInterceptor,
];

const auctionsAPI = createApiInstance<AuctionsApiCustomConfigProps>(
  {
    baseURL: AppServerConfig.API_URL,
  },
  [authRequestInterceptor],
  [responseInterceptor]
);

export { auctionsAPI };
