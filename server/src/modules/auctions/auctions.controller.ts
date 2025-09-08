import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import {
  AuctionDto,
  UpdateAuctionDto,
  CreateAuctionDto,
} from './dto/auction.dto';
import { AuthGuard, AuthorizedRequest } from '../auth/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @ApiOperation({ summary: 'Create an auction for a user' })
  @ApiResponse({
    status: 201,
    description: 'Auction created',
    type: AuctionDto,
  })
  @Post()
  create(
    @Body() createAuctionDto: CreateAuctionDto,
    @Req() { user }: AuthorizedRequest,
  ): Promise<AuctionDto> {
    return this.auctionsService.create(createAuctionDto, user.sub);
  }

  @ApiOperation({ summary: 'Get all user auctions' })
  @ApiResponse({
    status: 200,
    description: 'User auctions list',
    type: [AuctionDto],
  })
  @Get()
  findAll(@Req() { user }: AuthorizedRequest): Promise<AuctionDto[]> {
    return this.auctionsService.findAll(user.sub);
  }

  @ApiOperation({ summary: 'Get auction by id' })
  @ApiResponse({ status: 200, description: 'Auction found', type: AuctionDto })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() { user }: AuthorizedRequest,
  ): Promise<AuctionDto> {
    return this.auctionsService.findOne(id, user.sub);
  }

  @ApiOperation({ summary: 'Update auction' })
  @ApiResponse({
    status: 200,
    description: 'Auction updated',
    type: AuctionDto,
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAuctionDto: UpdateAuctionDto,
    @Req() { user }: AuthorizedRequest,
  ): Promise<AuctionDto> {
    return this.auctionsService.updateOne(id, updateAuctionDto, user.sub);
  }

  @ApiOperation({ summary: 'Delete auction' })
  @ApiResponse({ status: 200, description: 'Auction deleted' })
  @Delete(':id')
  remove(@Param('id') id: string, @Req() { user }: AuthorizedRequest) {
    return this.auctionsService.removeOne(id, user.sub);
  }
}
