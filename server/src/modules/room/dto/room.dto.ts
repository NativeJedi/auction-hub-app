import { ApiProperty } from '@nestjs/swagger';

export class RoomDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;
}
