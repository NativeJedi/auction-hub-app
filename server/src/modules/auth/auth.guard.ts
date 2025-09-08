import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService, TokenPayload } from './token.service';

export type AuthorizedRequest = Request & { user: TokenPayload };

@Injectable()
class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();

    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException();
    }

    const [authType, authToken] = authHeader.split(' ');

    if (authType !== 'Bearer' || !authToken) {
      throw new UnauthorizedException();
    }

    const user = this.tokenService.validateAccessToken(authToken);

    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = user;

    return true;
  }
}

export { AuthGuard };
