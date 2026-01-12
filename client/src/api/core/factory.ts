import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

interface ApiHttpMethodsInterface<K> {
  get<T>(url: string, config?: K): Promise<T>;
  post<T>(url: string, data?: unknown, config?: K): Promise<T>;
  put<T>(url: string, data?: unknown, config?: K): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: K): Promise<T>;
  delete<T>(url: string, config?: K): Promise<T>;
}

type ApiInstance<K> = ApiHttpMethodsInterface<K>;

// TODO: fix any
export type RequestInterceptor<T = any> = (
  config: InternalAxiosRequestConfig & T
) => T | Promise<T>;

export type SuccessResponseInterceptor<T = any> = (
  response: AxiosResponse & { config: InternalAxiosRequestConfig & T }
) => AxiosResponse;

export type ErrorResponseInterceptor = (error: AxiosError) => Promise<never>;

export type ResponseInterceptor = [
  SuccessResponseInterceptor | undefined,
  ErrorResponseInterceptor | undefined,
];

type ApiInstanceOptions = {
  baseURL: string;
};

export const createApiInstance = <K>(
  options: ApiInstanceOptions,
  requestInterceptors: Array<RequestInterceptor>,
  responseInterceptors: Array<ResponseInterceptor>
) => {
  const apiInstance = axios.create(options) as ApiInstance<K & AxiosRequestConfig>;

  requestInterceptors.forEach((interceptor) => {
    (apiInstance as AxiosInstance).interceptors.request.use(interceptor);
  });

  responseInterceptors.forEach(([success, error]) => {
    (apiInstance as AxiosInstance).interceptors.response.use(success, error);
  });

  return apiInstance;
};
