import { PickType } from '@nestjs/swagger';
import { RoomMember } from './room-member.entity';

export class Bid extends PickType(RoomMember, ['id', 'name', 'email']) {
  amount: number;
}
