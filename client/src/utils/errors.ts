import { isObjectWithProperty } from '@/src/utils/checkers';

export class UnauthorizedError extends Error {
  code: string;

  constructor() {
    super('User is not authorized');
    this.code = 'UNAUTHORIZED';
    this.name = 'UnauthorizedError';
  }
}

export const isUnauthorizedError = (error: unknown): error is UnauthorizedError => {
  return isObjectWithProperty(error, 'name') && error.name === 'UnauthorizedError';
};
