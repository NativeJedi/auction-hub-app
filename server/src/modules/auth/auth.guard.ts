import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { TokenService, TokenPayload } from './token.service';
import { ApiAuthorizationError, ApiTokenExpiredError } from '../../errors';

export type AuthorizedRequest = Request & { user: TokenPayload };

@Injectable()
class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();

    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new ApiAuthorizationError();
    }

    const [authType, authToken] = authHeader.split(' ');

    if (authType !== 'Bearer' || !authToken) {
      throw new ApiAuthorizationError();
    }

    const result = this.tokenService.accessToken.validate(authToken);

    if (result.payload) {
      request.user = result.payload;
      return true;
    }

    if (result.reason === 'expired') {
      throw new ApiTokenExpiredError();
    }

    throw new ApiAuthorizationError();
  }
}

export { AuthGuard };
