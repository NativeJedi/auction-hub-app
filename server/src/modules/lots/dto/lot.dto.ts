import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { LotStatus } from '../entities/lots.entity';
import { Currency } from '../../../types/currency';
import { Type } from 'class-transformer';

export class LotImageDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({
    example: 'http://localhost:9000/auction-images/lots/abc/uuid',
  })
  url: string;
}

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

  @ApiProperty({ type: [LotImageDto] })
  images: LotImageDto[];
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

export class PresignedUrlRequestDto {
  @ApiProperty({ example: 3, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  count: number;
}

export class PresignedUrlItemDto {
  @ApiProperty()
  presignedUrl: string;

  @ApiProperty()
  s3Key: string;
}

export class AddLotImageDto {
  @ApiProperty({ example: 'lots/lotId/uuid.webp' })
  @IsString()
  s3Key: string;
}

export class AddLotImagesDto {
  @ApiProperty({ type: [AddLotImageDto] })
  @ValidateNested({ each: true })
  @Type(() => AddLotImageDto)
  images: AddLotImageDto[];
}
