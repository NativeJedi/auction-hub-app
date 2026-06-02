import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class BidDto {
  @ApiProperty({
    description: 'Unique identifier of the bid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Unique identifier of the member who placed the bid',
    example: 'member_123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Name of the member',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Email of the member',
    example: 'john.doe@example.com',
  })
  email: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({
    description:
      'Absolute price the member is bidding (the full target amount, not an increment over the current bid)',
    example: 150,
  })
  amount: number;
}

export class CreateBidDto extends PickType(BidDto, ['amount']) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the lot the bid is placed on',
    example: 'lot_123e4567-e89b-12d3-a456-426614174000',
  })
  lotId: string;
}
