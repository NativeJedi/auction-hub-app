import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Auction, AuctionStatus } from '../auctions/entities/auction.entity';
import { AuctionsService } from '../auctions/auctions.service';
import { TokenPayload, TokenService } from '../auth/token.service';
import { EmailService } from '../email/email.service';
import { CreateInviteDto } from './dto/invite.dto';
import {
  Room,
  RoomAuction,
  RoomAuthorizedMember,
  RoomAuthorizedOwner,
  RoomRole,
} from './entities/room.entity';
import { BidDto, CreateBidDto } from './dto/bid.dto';
import { RoomRepository } from './room.repository';
import {
  RoomInfoMemberResponseDto,
  RoomInfoOwnerResponseDto,
} from './dto/room.dto';
import { BuyersService } from '../buyers/buyers.service';
import { LotsService } from '../lots/lots.service';
import { LotStatus } from '../lots/entities/lots.entity';
import { ApiAuthorizationError } from '../../errors';
import { pickArrayFields, pickFields } from '../../utils/pick';

@Injectable()
export class RoomService {
  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly roomRepository: RoomRepository,
    private readonly buyersService: BuyersService,
    private readonly lotsService: LotsService,
  ) {}

  async createRoom(user: TokenPayload, auctionId: Auction['id']) {
    const { sub: id, email } = user;

    const auction = await this.auctionsService.findOne(id, auctionId, true);

    const roomAuction: RoomAuction = {
      id: auction.id,
      name: auction.name,
      description: auction.description,
    };

    if (!auction.lots.length) {
      throw new BadRequestException('No lots created for this auction');
    }

    const room = await this.roomRepository.createRoom(
      id,
      roomAuction,
      auction.lots,
    );

    const token = this.tokenService.roomMemberToken.generate({
      sub: id,
      email,
      role: RoomRole.ADMIN,
      roomId: room.id,
    });

    await this.auctionsService.updateOne(id, auctionId, {
      status: AuctionStatus.STARTED,
    });

    return { room, token };
  }

  async getOwnerRoomInfo(
    roomId: Room['id'],
  ): Promise<RoomInfoOwnerResponseDto> {
    const fullInfo = await this.roomRepository.getRoomInfo(roomId);

    if (!fullInfo.room) {
      throw new NotFoundException('Room not found');
    }

    return {
      ...fullInfo,
      room: fullInfo.room,
    };
  }

  async getMemberRoomInfo(
    roomId: Room['id'],
  ): Promise<RoomInfoMemberResponseDto> {
    const fullInfo = await this.roomRepository.getRoomInfo(roomId);

    const { room } = fullInfo;

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return {
      room: {
        id: roomId,
        auction: pickFields(room.auction, ['name', 'description']),
      },
      activeLot: fullInfo.activeLot,
      activeLotBids: pickArrayFields(fullInfo.activeLotBids, [
        'name',
        'amount',
      ]),
    };
  }

  async sendRoomInvite(roomId: string, { email, name }: CreateInviteDto) {
    const room = await this.roomRepository.getRoom(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const existingUser = await this.roomRepository.getMemberByEmail(
      roomId,
      email,
    );

    if (existingUser) {
      throw new ConflictException('User already accepted invite');
    }

    const invite = await this.roomRepository.createInvite(roomId, {
      email,
      name,
    });

    const token = this.tokenService.roomMemberInviteToken.generate({
      sub: invite.id,
      email,
    });

    // TODO: insert real link
    const inviteLink = `http://localhost:3001/room/${roomId}/invite/confirm?token=${token}`;

    await this.emailService.sendEmail(
      email,
      'Room invite',
      `Hi, you registered as ${name} for auction. Here is your invite link: ${inviteLink}`,
    );

    return { invite, room };
  }

  async confirmRoomInvite(roomId: string, token: string) {
    const result = this.tokenService.roomMemberInviteToken.validate(token);

    if (!result.payload) {
      throw new ApiAuthorizationError();
    }

    const { room, member } = await this.roomRepository.createMember(
      roomId,
      result.payload.email,
    );

    const roomToken = this.tokenService.roomMemberToken.generate({
      sub: member.id,
      email: member.email,
      name: member.name,
      roomId: room.id,
      role: RoomRole.MEMBER,
    });

    return {
      room,
      member,
      token: roomToken,
    };
  }

  async finishAuction(owner: RoomAuthorizedOwner) {
    await this.finishActiveLot(owner);

    this.roomRepository.clearRoom(owner.roomId);
  }

  async finishActiveLot(owner: RoomAuthorizedOwner) {
    const [room, activeLotId, activeBid] = await Promise.all([
      this.roomRepository.getRoom(owner.roomId),
      this.roomRepository.getActiveLotId(owner.roomId),
      this.roomRepository.getActiveLotCurrentBid(owner.roomId),
    ]);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!activeLotId) {
      throw new NotFoundException('No active lot');
    }

    if (!activeBid) {
      await this.lotsService.updateLot(owner.id, room.auction.id, activeLotId, {
        status: LotStatus.UNSOLD,
      });

      return;
    }

    await Promise.all([
      this.lotsService.updateLot(owner.id, room.auction.id, activeLotId, {
        status: LotStatus.SOLD,
        soldPrice: activeBid.amount,
      }),
      this.buyersService.saveBuyer(owner.id, room.auction.id, activeLotId, {
        name: activeBid.name,
        email: activeBid.email,
      }),
    ]);
  }

  async placeNextLot(owner: RoomAuthorizedOwner) {
    await this.finishActiveLot(owner);

    const nextLot = await this.roomRepository.getNextLot(owner.roomId);

    if (!nextLot) {
      throw new NotFoundException('No more lots');
    }

    await this.roomRepository.setActiveLot(owner.roomId, nextLot.id);

    return nextLot;
  }

  async placeBid(
    member: RoomAuthorizedMember,
    bid: CreateBidDto,
  ): Promise<BidDto> {
    const newBid = await this.roomRepository.setBid(member.roomId, member, bid);

    return newBid;
  }
}
