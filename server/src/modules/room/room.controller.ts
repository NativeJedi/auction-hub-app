import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoomService } from './room.service';
import {
  CreateRoomDto,
  InviteConfirmResponseDto,
  RoomDto,
} from './dto/room.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ConfirmInviteDto, CreateInviteDto } from './dto/invite.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { TokenPayload } from '../auth/token.service';

@Controller('auctions/:auctionId/room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @ApiOperation({ summary: 'Create a room for an auction' })
  @ApiResponse({
    status: 201,
    type: CreateRoomDto,
  })
  @UseGuards(AuthGuard)
  @Post()
  createRoom(
    @AuthUser() user: TokenPayload,
    @Param('auctionId') auctionId: string,
  ): Promise<CreateRoomDto> {
    const owner = {
      id: user.sub,
      email: user.email,
    };

    return this.roomService.createRoom(owner, auctionId);
  }

  @ApiOperation({ summary: 'Get auction room by id' })
  @ApiResponse({
    status: 200,
    type: RoomDto,
  })
  @UseGuards(AuthGuard)
  @Get(':roomId')
  getAuctionRoom(
    @Param('auctionId') auctionId: string,
    @Param('roomId') roomId: string,
  ): Promise<RoomDto> {
    return this.roomService.findRoom(auctionId, roomId);
  }

  @ApiOperation({ summary: 'Send room invite to user email' })
  @ApiResponse({
    status: 200,
  })
  @HttpCode(200)
  @Post(':roomId/invite')
  sendRoomInvite(
    @Param('auctionId') auctionId: string,
    @Param('roomId') roomId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.roomService.sendRoomInvite(auctionId, roomId, dto);
  }

  @ApiOperation({ summary: 'Confirm room invite' })
  @ApiResponse({
    status: 200,
    type: [InviteConfirmResponseDto],
  })
  @HttpCode(200)
  @Post(':roomId/invite/confirm')
  confirmRoomInvite(
    @Param('auctionId') auctionId: string,
    @Param('roomId') roomId: string,
    @Body() dto: ConfirmInviteDto,
  ): Promise<InviteConfirmResponseDto> {
    return this.roomService.confirmRoomInvite(auctionId, roomId, dto.token);
  }
}
