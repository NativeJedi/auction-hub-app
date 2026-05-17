import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoomService } from './room.service';
import {
  CreateRoomResponseDto,
  RoomInfoResponseDto,
  RoomInfoOwnerResponseDto,
} from './dto/room.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ConfirmInviteDto, CreateInviteDto } from './dto/invite.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { TokenPayload } from '../auth/token.service';
import {
  Room,
  RoomAuthorizedOwner,
  RoomAuthorizedUser,
  RoomRole,
} from './entities/room.entity';
import { RoomAuthGuard, RoomAuthOptionalGuard } from './guards/auth.guard';
import { RoomRoles, RoomUser } from './guards/decorators';
import { RoomGateway } from './room.gateway';

@Controller('/room')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly roomGateway: RoomGateway,
  ) {}

  @ApiOperation({ summary: 'Start an auction room' })
  @ApiResponse({ status: 201, type: Room })
  @UseGuards(AuthGuard)
  @Post(':auctionId/start')
  async startAuction(
    @AuthUser() user: TokenPayload,
    @Param('auctionId') auctionId: string,
  ): Promise<CreateRoomResponseDto> {
    return this.roomService.createRoom(user, auctionId);
  }

  @ApiOperation({ summary: 'Finish an auction' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RoomRoles(RoomRole.ADMIN)
  @UseGuards(RoomAuthGuard)
  @Post(':auctionId/finish')
  async finishAuction(@RoomUser() owner: RoomAuthorizedOwner): Promise<void> {
    await this.roomService.finishAuction(owner);
    this.roomGateway.publishRoomEvent(owner.auctionId, 'auctionFinished', {});
  }

  @ApiOperation({ summary: 'Restart an auction' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  @Post(':auctionId/restart')
  async restartAuction(
    @AuthUser() user: TokenPayload,
    @Param('auctionId') auctionId: string,
  ): Promise<void> {
    await this.roomService.restartAuction(user.sub, auctionId);
  }

  @ApiOperation({ summary: 'Get auction room admin info by id' })
  @ApiResponse({
    status: 200,
    type: [RoomInfoOwnerResponseDto],
  })
  @RoomRoles(RoomRole.ADMIN)
  @UseGuards(RoomAuthGuard)
  @Get(':auctionId/admin')
  getAdminRoomInfo(
    @Param('auctionId') auctionId: string,
  ): Promise<RoomInfoOwnerResponseDto> {
    return this.roomService.getOwnerRoomInfo(auctionId);
  }

  @ApiOperation({ summary: 'Get auction room info by id' })
  @ApiResponse({
    status: 200,
    type: RoomInfoResponseDto,
  })
  @UseGuards(RoomAuthOptionalGuard)
  @Get(':auctionId')
  getRoomInfo(
    @Param('auctionId') auctionId: string,
    @RoomUser() roomUser: RoomAuthorizedUser | null,
  ): Promise<RoomInfoResponseDto> {
    return this.roomService.getRoomInfo(auctionId, roomUser);
  }

  @ApiOperation({ summary: 'Send room invite to user email' })
  @ApiResponse({
    status: 200,
  })
  @HttpCode(200)
  @Post(':auctionId/invite')
  async sendRoomInvite(
    @Param('auctionId') auctionId: string,
    @Body() dto: CreateInviteDto,
  ) {
    const { invite, room } = await this.roomService.sendRoomInvite(
      auctionId,
      dto,
    );

    this.roomGateway.publishRoomUserEvent(
      auctionId,
      room.ownerId,
      'newInvite',
      invite,
    );
  }

  @ApiOperation({ summary: 'Confirm room invite' })
  @ApiResponse({
    status: 200,
  })
  @HttpCode(200)
  @Post(':auctionId/invite/confirm')
  async confirmRoomInvite(
    @Param('auctionId') auctionId: string,
    @Body() dto: ConfirmInviteDto,
  ) {
    const { room, member, token } = await this.roomService.confirmRoomInvite(
      auctionId,
      dto.token,
    );

    this.roomGateway.publishRoomUserEvent(
      auctionId,
      room.ownerId,
      'newMember',
      member,
    );

    return { token };
  }
}
