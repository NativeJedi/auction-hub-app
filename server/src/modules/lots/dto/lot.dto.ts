import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { LotStatus } from '../entities/lots.entity';
import { Currency } from '../../../types/currency';
import { Type } from 'class-transformer';

export class LotDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Some lot name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Optional description', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1000, minimum: 0 })
  @IsNumber()
  @Min(0)
  startPrice: number;

  @IsEnum(Currency)
  @IsNotEmpty()
  @ApiProperty({ example: 'created', enum: LotStatus })
  currency: Currency;

  @ApiProperty({ example: 'created', enum: LotStatus })
  status: LotStatus;

  @ApiProperty({ example: '2025-09-01T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-09-01T12:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: 1000, minimum: 0, nullable: true })
  @IsNumber()
  @Min(0)
  soldPrice?: number;
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
  PickType(LotDto, [
    'name',
    'description',
    'startPrice',
    'currency',
    'status',
    'soldPrice',
  ]),
) {}
