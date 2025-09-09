import { ApiProperty } from '@nestjs/swagger';
import { RoomAdmin } from '../entities/room.entity';

class RoomAdminDto {
  @ApiProperty({ description: 'uuid', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'email', example: 'admin@email.com' })
  email: string;
}

export class RoomDto {
  @ApiProperty({ description: 'uuid', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'uuid', example: 'uuid-string' })
  auctionId: string;

  @ApiProperty({ description: 'owner details', type: RoomAdminDto })
  owner: RoomAdmin;
}

export class CreateRoomDto {
  @ApiProperty({ description: 'Room details', type: RoomDto })
  room: RoomDto;

  @ApiProperty({ description: 'Admin token to manage the room' })
  token: string;
}

export class InviteConfirmResponseDto {
  @ApiProperty({ description: 'Room member token', example: '12312312' })
  token: string;
}
