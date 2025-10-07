import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LotsService } from './lots.service';
import { CreateLotsDto, LotDto, UpdateLotDto } from './dto/lot.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { TokenPayload } from '../auth/token.service';

@UseGuards(AuthGuard)
@Controller('/auctions/:auctionId/lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @ApiOperation({ summary: 'Create a lots for an auction' })
  @ApiResponse({
    status: 201,
    type: [LotDto],
  })
  @Post()
  async create(
    @Param('auctionId') auctionId: string,
    @AuthUser() user: TokenPayload,
    @Body() { lots }: CreateLotsDto,
  ): Promise<LotDto[]> {
    return this.lotsService.createLots(user.sub, auctionId, lots);
  }

  @ApiOperation({ summary: 'Get all lots' })
  @ApiResponse({
    status: 200,
    type: [LotDto],
  })
  @Get()
  async findAll(
    @Param('auctionId') auctionId: string,
    @AuthUser() user: TokenPayload,
  ): Promise<LotDto[]> {
    return this.lotsService.findAll(user.sub, auctionId);
  }

  @ApiOperation({ summary: 'Get lot by id' })
  @ApiResponse({
    status: 200,
    type: LotDto,
  })
  @Get(':lotId')
  async findOne(
    @Param('auctionId') auctionId: string,
    @Param('lotId') lotId: string,
    @AuthUser() user: TokenPayload,
  ): Promise<LotDto> {
    return this.lotsService.findLot(user.sub, auctionId, lotId);
  }

  @ApiOperation({ summary: 'Update lot by id' })
  @ApiResponse({
    status: 200,
    type: LotDto,
  })
  @Patch(':lotId')
  async update(
    @Param('auctionId') auctionId: string,
    @Param('lotId') lotId: string,
    @AuthUser() user: TokenPayload,
    @Body() lot: UpdateLotDto,
  ): Promise<LotDto> {
    return this.lotsService.updateLot(user.sub, auctionId, lotId, lot);
  }

  @ApiOperation({ summary: 'Delete lot by id' })
  @ApiResponse({ status: 200 })
  @Delete(':lotId')
  async remove(
    @Param('auctionId') auctionId: string,
    @Param('lotId') lotId: string,
    @AuthUser() user: TokenPayload,
  ) {
    return this.lotsService.removeLot(user.sub, auctionId, lotId);
  }
}
