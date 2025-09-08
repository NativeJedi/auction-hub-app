import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthorizedRequest } from '../auth.guard';
import { TokenPayload } from '../token.service';

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest<AuthorizedRequest>();

    return request.user;
  },
);
