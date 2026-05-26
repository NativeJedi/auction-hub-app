import { UnauthorizedException } from '@nestjs/common';

enum UnauthorizedErrorReason {
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INVALID_AUTH = 'INVALID_AUTH',
  NONCE_NOT_FOUND = 'NONCE_NOT_FOUND',
}

export class ApiAuthorizationError extends UnauthorizedException {
  constructor(reason?: UnauthorizedErrorReason) {
    super({
      message: 'Authorization error',
      reason: reason || UnauthorizedErrorReason.INVALID_AUTH,
    });
  }
}

export class ApiTokenExpiredError extends ApiAuthorizationError {
  constructor() {
    super(UnauthorizedErrorReason.EXPIRED_TOKEN);
  }
}

export class ApiNonceNotFoundError extends ApiAuthorizationError {
  constructor() {
    super(UnauthorizedErrorReason.NONCE_NOT_FOUND);
  }
}
