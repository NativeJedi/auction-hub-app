import { AxiosError } from 'axios';
import { isObjectWithProperty } from '@/src/utils/checkers';

export class TokenExpiredError extends AxiosError {
  constructor(error: AxiosError) {
    super(error.message, '401', error.config, error.request, error.response);

    this.name = 'TokenExpiredError';
  }
}

export const isTokenExpiredError = (error: unknown): error is TokenExpiredError => {
  return isObjectWithProperty(error, 'name') && error.name === 'TokenExpiredError';
};

export const isApiExpiredTokenError = (error: AxiosError) => {
  return (
    error.response?.status === 401 && (error.response?.data as any)?.reason === 'EXPIRED_TOKEN'
  );
};
