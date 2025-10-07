import { ApiProperty } from '@nestjs/swagger';
import { RoomMember } from '../entities/room-member.entity';
import { RoomLot } from '../entities/room-lot.entity';
import { RoomInvite } from '../entities/room-invite.entity';
import { Bid } from '../entities/bid.entity';
import { Room, RoomAuction } from '../entities/room.entity';

export class CreateRoomResponseDto {
  room: Room;

  token: string;
}

export class RoomInfoOwnerResponseDto {
  room: Room;

  @ApiProperty({
    description: 'List of auction lot IDs',
    type: [RoomLot],
  })
  lots: RoomLot[];

  @ApiProperty({
    description: 'Active lot ID in the room',
    type: [RoomLot],
    required: false,
  })
  activeLot?: RoomLot;

  @ApiProperty({
    description: 'List of members in the room',
    type: [Bid],
  })
  activeLotBids: Bid[];

  @ApiProperty({
    description: 'List of members in the room',
    type: [RoomMember],
  })
  members: RoomMember[];

  @ApiProperty({
    description: 'List of pending invites in the room',
    type: [RoomInvite],
  })
  invites: RoomInvite[];
}

class MemberRoomInfo {
  id: Room['id'];

  auction: Pick<RoomAuction, 'name' | 'description'>;
}

class MemberBidInfo {
  name: Bid['name'];

  amount: Bid['amount'];
}

export class RoomInfoMemberResponseDto {
  room: MemberRoomInfo;

  activeLot?: RoomLot;

  activeLotBids: MemberBidInfo[];
}
