import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import {
  AuctionDto,
  UpdateAuctionDto,
  CreateAuctionDto,
} from './dto/auction.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { TokenPayload } from '../auth/token.service';
import {
  PaginatedResponseDto,
  QueryPaginationDto,
} from '../pagination/pagination.dto';
import { ApiPaginatedResponse } from '../pagination/pagination.decorator';

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
    @AuthUser() user: TokenPayload,
  ): Promise<AuctionDto> {
    return this.auctionsService.create(createAuctionDto, user.sub);
  }

  @ApiOperation({ summary: 'Get paginated user auctions' })
  @ApiPaginatedResponse(AuctionDto)
  @Get()
  findAll(
    @AuthUser() user: TokenPayload,
    @Query() query: QueryPaginationDto,
  ): Promise<PaginatedResponseDto<AuctionDto>> {
    return this.auctionsService.findAll(user.sub, query);
  }

  @ApiOperation({ summary: 'Get auction by id' })
  @ApiResponse({ status: 200, description: 'Auction found', type: AuctionDto })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @AuthUser() user: TokenPayload,
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
    @AuthUser() user: TokenPayload,
  ): Promise<AuctionDto> {
    return this.auctionsService.updateOne(id, updateAuctionDto, user.sub);
  }

  @ApiOperation({ summary: 'Delete auction' })
  @ApiResponse({ status: 200, description: 'Auction deleted' })
  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() user: TokenPayload) {
    return this.auctionsService.removeOne(id, user.sub);
  }
}
