import { ApiProperty } from '@nestjs/swagger';
import { LotStatus } from '../../lots/entities/lots.entity';

export class LotResultDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Vintage Watch' })
  name: string;

  @ApiProperty({ example: 'sold', enum: LotStatus })
  status: LotStatus;

  @ApiProperty({ example: 1500, nullable: true })
  soldPrice: number | null;

  @ApiProperty({ example: 'John Doe', nullable: true })
  buyerName: string | null;
}

export class AuctionResultsDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Spring Auction 2026' })
  name: string;

  @ApiProperty({ example: 'Annual spring charity auction', nullable: true })
  description: string | null;

  @ApiProperty({ example: '2026-05-15T14:00:00Z', nullable: true })
  finishedAt: Date | null;

  @ApiProperty({ example: 4 })
  totalLots: number;

  @ApiProperty({ example: 3 })
  soldCount: number;

  @ApiProperty({ example: 1 })
  unsoldCount: number;

  @ApiProperty({ example: { USD: 4500, EUR: 1200 } })
  valuesByCurrency: Record<string, number>;

  @ApiProperty({ type: [LotResultDto] })
  lots: LotResultDto[];
}
