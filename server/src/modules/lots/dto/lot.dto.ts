import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { LotStatus } from '../entities/lots.entity';
import { Currency } from '../../../types/currency';
import { Type } from 'class-transformer';

class LotDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Some lot name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Optional description', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0, { message: 'Start price must be greater than or equal to 0' })
  @ApiProperty({ example: '2000', minimum: 0 })
  startPrice: number;

  @IsEnum(Currency)
  @ApiProperty({ example: 'created', enum: LotStatus })
  currency: Currency;

  @ApiProperty({ example: 'created', enum: LotStatus })
  status: LotStatus;

  @ApiProperty({ example: '2025-09-01T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-09-01T12:00:00Z' })
  updatedAt: Date;
}

export class CreateLotDto extends PickType(LotDto, [
  'name',
  'description',
  'startPrice',
  'currency',
]) {}

export class CreateLotsDto {
  @ValidateNested({ each: true })
  @Type(() => CreateLotDto)
  lots: CreateLotDto[];
}

export class UpdateLotDto extends PartialType(
  PickType(LotDto, ['name', 'description', 'startPrice', 'currency']),
) {}

export class LotResponseDto extends PickType(LotDto, [
  'id',
  'name',
  'description',
  'startPrice',
  'currency',
  'status',
  'createdAt',
  'updatedAt',
]) {}
