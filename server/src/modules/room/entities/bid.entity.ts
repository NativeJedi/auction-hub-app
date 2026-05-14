import { PickType } from '@nestjs/swagger';
import { RoomMember } from './room-member.entity';

export class Bid extends PickType(RoomMember, ['name', 'email']) {
  id: string;
  userId: string;
  amount: number;
}
