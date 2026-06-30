import type { ErrorServerResponse } from '@/src/api/types';

export class ApiError extends Error {
  status: number;
  reason: string;

  constructor({ message, status, reason }: ErrorServerResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.reason = reason;
  }
}

export const isEmailNotVerifiedError = (error: unknown) =>
  error instanceof ApiError && error.message === 'EMAIL_NOT_VERIFIED';

export const is429Error = (error: unknown) => error instanceof ApiError && error.status === 429;
