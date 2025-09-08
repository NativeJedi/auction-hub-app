import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomDto } from './dto/room.dto';
import { AuthGuard, AuthorizedRequest } from '../auth/auth.guard';

@Controller('auctions/:auctionId/room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @UseGuards(AuthGuard)
  @Post('room')
  createRoom(
    @Req() req: AuthorizedRequest,
    @Param('auctionId') auctionId: string,
  ): Promise<RoomDto> {
    return this.roomService.createRoom(req.user.sub, auctionId);
  }
}
