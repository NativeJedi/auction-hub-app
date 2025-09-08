import { SetMetadata } from '@nestjs/common';
import { ROOM_ROLES_KEY, RoomRole } from './room-roles.constants';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Member } from '../../modules/room/entities/member.entity';

export const RoomRoles = (...roles: RoomRole[]) =>
  SetMetadata(ROOM_ROLES_KEY, roles);

export const RoomUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Member | null => {
    const client: Socket = ctx.switchToWs().getClient();
    return client.data?.user ?? null;
  },
);
