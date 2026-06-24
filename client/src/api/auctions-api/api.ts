import { getServerConfig } from '@/config/server';
import {
  authRequestInterceptor,
  forwardClientIpInterceptor,
  dataResponseInterceptor,
  errorResponseInterceptor,
} from '@/src/api/auctions-api/interceptors';
import { createApiInstance, RequestInterceptor, ResponseInterceptor } from '@/src/api/core/factory';
import { AuctionsApiCustomConfigProps } from '@/src/api/auctions-api/types';

const responseInterceptor: ResponseInterceptor = [
  dataResponseInterceptor,
  errorResponseInterceptor,
];

// Resolve baseURL lazily per request so getServerConfig() (and its env
// validation) runs at runtime — never at build / module-eval time.
const baseUrlInterceptor: RequestInterceptor = (config) => {
  config.baseURL = getServerConfig().API_URL;
  return config;
};

const auctionsAPI = createApiInstance<AuctionsApiCustomConfigProps>(
  { baseURL: '' },
  [baseUrlInterceptor, forwardClientIpInterceptor, authRequestInterceptor],
  [responseInterceptor]
);

export { auctionsAPI };
