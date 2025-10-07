import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export type ApiRequestConfig = AxiosRequestConfig & {
  fullResponse?: boolean;
};

export type ApiResponse = AxiosResponse & { config: ApiRequestConfig };

export interface TypedAxiosInstance extends AxiosInstance {
  get<R>(url: string, config?: ApiRequestConfig): Promise<R>;
  post<R>(url: string, data?: any, config?: ApiRequestConfig): Promise<R>;
  put<R>(url: string, data?: any, config?: ApiRequestConfig): Promise<R>;
  patch<R>(url: string, data?: any, config?: ApiRequestConfig): Promise<R>;
  delete<R>(url: string, config?: ApiRequestConfig): Promise<R>;
}

export interface ApiError<T = any> extends Error {
  data?: T;
  _originalError?: AxiosError;
  message: string;
}
