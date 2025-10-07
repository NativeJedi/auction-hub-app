import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { RoomAuthorizedUser, RoomRole } from '../entities/room.entity';
import { Socket } from 'socket.io';
import { ROOM_ROLES_KEY } from './constants';

export const RoomRoles = (...roles: RoomRole[]) =>
  SetMetadata(ROOM_ROLES_KEY, roles);

export const RoomSockerUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RoomAuthorizedUser | null => {
    const client: Socket = ctx.switchToWs().getClient();
    return client.data?.user ?? null;
  },
);
