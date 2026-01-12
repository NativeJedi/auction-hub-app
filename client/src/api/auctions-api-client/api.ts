import {
  dataResponseInterceptor,
  errorResponseInterceptor,
} from '@/src/api/auctions-api-client/interceptors';
import { createApiInstance, ResponseInterceptor } from '@/src/api/core/factory';
import { AuctionsApiClientCustomConfigProps } from '@/src/api/auctions-api-client/types';

const BASE_URL = '/api';

const responseInterceptor: ResponseInterceptor = [
  dataResponseInterceptor,
  errorResponseInterceptor,
];

const auctionsApiClient = createApiInstance<AuctionsApiClientCustomConfigProps>(
  {
    baseURL: BASE_URL,
  },
  [],
  [responseInterceptor]
);

export { auctionsApiClient };
