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
  CreateRoomResponseDto,
  RoomInfoResponseDto,
  RoomInfoOwnerResponseDto,
} from './dto/room.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ConfirmInviteDto, CreateInviteDto } from './dto/invite.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { TokenPayload } from '../auth/token.service';
import { Room, RoomAuthorizedUser, RoomRole } from './entities/room.entity';
import { RoomAuthGuard, RoomAuthOptionalGuard } from './guards/auth.guard';
import { RoomRoles, RoomUser } from './guards/decorators';
import { RoomGateway } from './room.gateway';

@Controller('/room')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly roomGateway: RoomGateway,
  ) {}

  @ApiOperation({ summary: 'Create a room for an auction' })
  @ApiResponse({
    status: 201,
    type: Room,
  })
  @UseGuards(AuthGuard)
  @Post()
  async createRoom(
    @AuthUser() user: TokenPayload,
    @Body() { auctionId }: { auctionId: string },
  ): Promise<CreateRoomResponseDto> {
    return this.roomService.createRoom(user, auctionId);
  }

  @ApiOperation({ summary: 'Get auction room admin info by id' })
  @ApiResponse({
    status: 200,
    type: [RoomInfoOwnerResponseDto],
  })
  @RoomRoles(RoomRole.ADMIN)
  @UseGuards(RoomAuthGuard)
  @Get(':roomId/admin')
  getAdminRoomInfo(
    @Param('roomId') roomId: string,
  ): Promise<RoomInfoOwnerResponseDto> {
    return this.roomService.getOwnerRoomInfo(roomId);
  }

  @ApiOperation({ summary: 'Get auction room info by id' })
  @ApiResponse({
    status: 200,
    type: RoomInfoResponseDto,
  })
  @UseGuards(RoomAuthOptionalGuard)
  @Get(':roomId')
  getRoomInfo(
    @Param('roomId') roomId: string,
    @RoomUser() roomUser: RoomAuthorizedUser | null,
  ): Promise<RoomInfoResponseDto> {
    return this.roomService.getRoomInfo(roomId, roomUser);
  }

  @ApiOperation({ summary: 'Send room invite to user email' })
  @ApiResponse({
    status: 200,
  })
  @HttpCode(200)
  @Post(':roomId/invite')
  async sendRoomInvite(
    @Param('roomId') roomId: string,
    @Body() dto: CreateInviteDto,
  ) {
    const { invite, room } = await this.roomService.sendRoomInvite(roomId, dto);

    this.roomGateway.publishRoomUserEvent(
      roomId,
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
  @Post(':roomId/invite/confirm')
  async confirmRoomInvite(
    @Param('roomId') roomId: string,
    @Body() dto: ConfirmInviteDto,
  ) {
    const { room, member, token } = await this.roomService.confirmRoomInvite(
      roomId,
      dto.token,
    );

    this.roomGateway.publishRoomUserEvent(
      roomId,
      room.ownerId,
      'newMember',
      member,
    );

    return { token };
  }
}
