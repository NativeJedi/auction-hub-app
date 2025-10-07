import { ApiProperty, PickType } from '@nestjs/swagger';

export class BidDto {
  @ApiProperty({
    description: 'Unique identifier of the member who placed the bid',
    example: 'member_123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

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

  @ApiProperty({
    description: 'Amount of the bid placed by the member',
    example: 150,
  })
  amount: number;
}

export class CreateBidDto extends PickType(BidDto, ['amount']) {
  @ApiProperty({
    description: 'ID of the lot the bid is placed on',
    example: 'lot_123e4567-e89b-12d3-a456-426614174000',
  })
  lotId: string;
}
