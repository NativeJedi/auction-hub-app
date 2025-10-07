import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID } from 'class-validator';

export class BuyerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ format: 'uuid', description: 'Id of the won lot' })
  @IsUUID()
  lotId: string;
}

export class CreateBuyerDto extends PickType(BuyerDto, [
  'name',
  'email',
] as const) {}
