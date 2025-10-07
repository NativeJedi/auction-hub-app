import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROOM_ROLES_KEY } from './constants';
import { RoomRole } from '../entities/room.entity';
import { AuthorizedRequest } from '../../auth/auth.guard';
import { ApiAuthorizationError } from '../../../errors';
import { TokenService } from '../../auth/token.service';

@Injectable()
export class RoomAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthorizedRequest>();
    const { roomId } = request.params;

    const authHeader = request.headers['x-room-token'];

    if (!authHeader) {
      throw new ApiAuthorizationError();
    }

    const authToken = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    const result = this.tokenService.roomMemberToken.validate(authToken);

    if (!result.payload) {
      throw new ApiAuthorizationError();
    }

    const requiredRoles = this.reflector.getAllAndOverride<RoomRole[]>(
      ROOM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const { sub: id, ...roomUser } = result.payload;

    if (
      (requiredRoles && !requiredRoles.includes(roomUser.role)) ||
      roomId !== roomUser.roomId
    ) {
      throw new ApiAuthorizationError();
    }

    request['roomUser'] = {
      id,
      ...roomUser,
    };

    return true;
  }
}
