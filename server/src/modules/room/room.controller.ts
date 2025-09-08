import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomResponseDto } from './dto/room.dto';
import { AuthGuard, AuthorizedRequest } from '../auth/auth.guard';
import { ConfirmInviteDto, CreateInviteDto } from './dto/invite.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auctions/:auctionId/room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @ApiOperation({ summary: 'Create a room for an auction' })
  @ApiResponse({
    status: 201,
    type: RoomResponseDto,
  })
  @UseGuards(AuthGuard)
  @Post()
  createRoom(
    @Req() req: AuthorizedRequest,
    @Param('auctionId') auctionId: string,
  ): Promise<RoomResponseDto> {
    const owner = {
      id: req.user.sub,
      email: req.user.email,
    };

    return this.roomService.createRoom(owner, auctionId);
  }

  @ApiOperation({ summary: 'Send room invite to user email' })
  @ApiResponse({
    status: 200,
  })
  @HttpCode(200)
  @Post(':roomId/invite')
  createRoomInvite(
    @Param('auctionId') auctionId: string,
    @Param('roomId') roomId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.roomService.createRoomInvite(auctionId, roomId, dto);
  }

  @ApiOperation({ summary: 'Confirm room invite' })
  @HttpCode(200)
  @Post(':roomId/invite/confirm')
  confirmRoomInvite(
    @Param('auctionId') auctionId: string,
    @Param('roomId') roomId: string,
    @Body() dto: ConfirmInviteDto,
  ) {
    return this.roomService.confirmRoomInvite(auctionId, roomId, dto.token);
  }
}
