import { ApiProperty } from '@nestjs/swagger';
import { Room } from '../entities/room.entity';

export class RoomResponseDto {
  @ApiProperty({ description: 'Room details' })
  room: Room;

  @ApiProperty({ description: 'Admin token to manage the room' })
  token: string;
}
