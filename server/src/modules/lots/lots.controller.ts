import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LotsService } from './lots.service';
import { CreateLotsDto, LotResponseDto, UpdateLotDto } from './dto/lot.dto';
import { AuthGuard, AuthorizedRequest } from '../auth/auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('auctions/:auctionId/lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @ApiOperation({ summary: 'Create a lots for an auction' })
  @ApiResponse({
    status: 201,
    type: [LotResponseDto],
  })
  @Post()
  async create(
    @Param('auctionId') auctionId: string,
    @Req() req: AuthorizedRequest,
    @Body() { lots }: CreateLotsDto,
  ): Promise<LotResponseDto[]> {
    const userId = req.user.sub;

    return this.lotsService.createLots(userId, auctionId, lots);
  }

  @ApiOperation({ summary: 'Get all lots' })
  @ApiResponse({
    status: 200,
    type: [LotResponseDto],
  })
  @Get()
  async findAll(
    @Param('auctionId') auctionId: string,
    @Req() req: AuthorizedRequest,
  ): Promise<LotResponseDto[]> {
    const userId = req.user.sub;

    return this.lotsService.findAll(userId, auctionId);
  }

  @ApiOperation({ summary: 'Get lot by id' })
  @ApiResponse({
    status: 200,
    type: LotResponseDto,
  })
  @Get(':lotId')
  async findOne(
    @Param('auctionId') auctionId: string,
    @Param('lotId') lotId: string,
    @Req() req: AuthorizedRequest,
  ): Promise<LotResponseDto> {
    const userId = req.user.sub;

    return this.lotsService.findLot(userId, auctionId, lotId);
  }

  @ApiOperation({ summary: 'Update lot by id' })
  @ApiResponse({
    status: 200,
    type: LotResponseDto,
  })
  @Patch(':lotId')
  async update(
    @Param('auctionId') auctionId: string,
    @Param('lotId') lotId: string,
    @Req() req: AuthorizedRequest,
    @Body() lot: UpdateLotDto,
  ): Promise<LotResponseDto> {
    const userId = req.user.sub;

    return this.lotsService.updateLot(userId, auctionId, lotId, lot);
  }

  @ApiOperation({ summary: 'Delete lot by id' })
  @ApiResponse({ status: 200 })
  @Delete(':lotId')
  async remove(
    @Param('auctionId') auctionId: string,
    @Param('lotId') lotId: string,
    @Req() req: AuthorizedRequest,
  ) {
    const userId = req.user.sub;

    return this.lotsService.removeLot(userId, auctionId, lotId);
  }
}
