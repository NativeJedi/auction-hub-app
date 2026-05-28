import { hasErrorData } from '@/src/utils/checkers';

const isEmailNotVerifiedError = (error: unknown) =>
  hasErrorData(error, 'message', 'EMAIL_NOT_VERIFIED');

const is429Error = (error: unknown) => hasErrorData(error, 'statusCode', 429);

export { isEmailNotVerifiedError, is429Error };
