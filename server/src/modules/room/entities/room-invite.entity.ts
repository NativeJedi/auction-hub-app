import { PickType } from '@nestjs/swagger';
import { RoomMember } from './room-member.entity';

export class RoomInvite extends PickType(RoomMember, ['id', 'name', 'email']) {}
