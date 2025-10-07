import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Socket } from 'socket.io';
import { ROOM_ROLES_KEY } from './constants';
import { RoomAuthorizedUser, RoomRole } from '../entities/room.entity';

@Injectable()
export class WSRoomRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoomRole[]>(
      ROOM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const client: Socket = context.switchToWs().getClient();
    const user = client.data.user as RoomAuthorizedUser;

    if (!user) {
      client.emit('error', { message: 'User not authorized' });
      client.disconnect(true);
      return false;
    }

    if (!requiredRoles.includes(user.role)) {
      client.emit('error', 'You are not authorized for this action');
      client.disconnect(true);
      return false;
    }

    return true;
  }
}
