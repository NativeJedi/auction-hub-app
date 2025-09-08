import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuctionStatus } from '../entities/auction.entity';

export class AuctionDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Some auction name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Optional description', nullable: true })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'created', enum: AuctionStatus })
  status: AuctionStatus;

  @ApiProperty({ example: '2025-09-01T12:00:00Z' })
  createdAt: Date;
}

export class CreateAuctionDto extends PickType(AuctionDto, [
  'name',
  'description',
]) {}

export class UpdateAuctionDto extends PartialType(
  PickType(AuctionDto, ['name', 'description', 'status']),
)  {}
