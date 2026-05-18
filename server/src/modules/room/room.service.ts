import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
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
  RoomAuthorizedUser,
  RoomRole,
} from './entities/room.entity';
import { BidDto, CreateBidDto } from './dto/bid.dto';
import { RoomRepository } from './room.repository';
import { RoomInfoResponseDto, RoomInfoOwnerResponseDto } from './dto/room.dto';
import { BuyersService } from '../buyers/buyers.service';
import { LotsService } from '../lots/lots.service';
import { LotStatus } from '../lots/entities/lots.entity';
import { RoomLot } from './entities/room-lot.entity';
import { ApiAuthorizationError } from '../../errors';
import { pickArrayFields, pickFields } from '../../utils/pick';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class RoomService {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly auctionsService: AuctionsService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly roomRepository: RoomRepository,
    private readonly buyersService: BuyersService,
    private readonly lotsService: LotsService,
  ) {}

  async createRoom(user: TokenPayload, auctionId: Auction['id']) {
    const { sub: id, email } = user;

    const [auction, lots] = await Promise.all([
      this.auctionsService.findEditableOne(id, auctionId),
      this.lotsService.findAll(id, auctionId),
    ]);


    const roomAuction: RoomAuction = {
      name: auction.name,
      description: auction.description,
    };

    if (!lots.length) {
      throw new BadRequestException('No lots created for this auction');
    }

    if (await this.roomRepository.roomExists(auctionId)) {
      throw new UnprocessableEntityException(
        'Auction already has an active room',
      );
    }

    const room = await this.roomRepository.createRoom(
      id,
      auctionId,
      roomAuction,
      lots,
    );

    const token = this.tokenService.roomMemberToken.generate({
      sub: id,
      email,
      role: RoomRole.ADMIN,
      auctionId: room.auctionId,
    });

    await this.auctionsService.startAuction(auctionId);

    return { room, token };
  }

  async getOwnerRoomInfo(
    auctionId: Room['auctionId'],
  ): Promise<RoomInfoOwnerResponseDto> {
    const fullInfo = await this.roomRepository.getRoomInfo(auctionId);

    if (!fullInfo.room) {
      throw new NotFoundException('Room not found');
    }

    return {
      ...fullInfo,
      room: fullInfo.room,
    };
  }

  async getRoomInfo(
    auctionId: Room['auctionId'],
    currentUser?: RoomAuthorizedUser | null,
  ): Promise<RoomInfoResponseDto> {
    const fullInfo = await this.roomRepository.getRoomInfo(auctionId);

    const { room } = fullInfo;

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const user = currentUser
      ? {
          id: currentUser.id,
          name: 'name' in currentUser ? currentUser.name : undefined,
          email: currentUser.email,
        }
      : undefined;

    return {
      room: {
        auctionId,
        auction: pickFields(room.auction, ['name', 'description']),
      },
      activeLot: fullInfo.activeLot,
      activeLotBids: pickArrayFields(fullInfo.activeLotBids, [
        'id',
        'userId',
        'name',
        'amount',
      ]),
      user,
    };
  }

  async sendRoomInvite(auctionId: string, { email, name }: CreateInviteDto) {
    const room = await this.roomRepository.getRoom(auctionId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const existingUser = await this.roomRepository.getMemberByEmail(
      auctionId,
      email,
    );

    if (existingUser) {
      throw new ConflictException('User already accepted invite');
    }

    const invite = await this.roomRepository.createInvite(auctionId, {
      email,
      name,
    });

    const token = this.tokenService.roomMemberInviteToken.generate({
      sub: invite.id,
      email,
    });

    const inviteLink = `${this.appConfig.urls.CLIENT_URL}/room/${auctionId}/invite/confirm?token=${token}`;

    await this.emailService.sendEmail(
      email,
      'Room invite',
      `Hi, you registered as ${name} for auction. Here is your invite link: ${inviteLink}`,
    );

    return { invite, room };
  }

  async confirmRoomInvite(auctionId: string, token: string) {
    const result = this.tokenService.roomMemberInviteToken.validate(token);

    if (!result.payload) {
      throw new ApiAuthorizationError();
    }

    const { room, member } = await this.roomRepository.createMember(
      auctionId,
      result.payload.email,
    );

    const roomToken = this.tokenService.roomMemberToken.generate({
      sub: member.id,
      email: member.email,
      name: member.name,
      auctionId: room.auctionId,
      role: RoomRole.MEMBER,
    });

    return {
      room,
      member,
      token: roomToken,
    };
  }

  async finishAuction(owner: RoomAuthorizedOwner): Promise<void> {
    const auction = await this.auctionsService.findOne(
      owner.id,
      owner.auctionId,
    );

    if (auction.status !== AuctionStatus.STARTED) {
      throw new BadRequestException('Auction is not in STARTED state');
    }

    await this.finishActiveLot(owner);
    await this.completeAuction(owner);
  }

  private async completeAuction(owner: RoomAuthorizedOwner): Promise<void> {
    await this.lotsService.makeCreatedLotsUnsold(owner.id, owner.auctionId);
    await this.auctionsService.finishAuction(owner.auctionId);
    await this.roomRepository.clearRoom(owner.auctionId);
  }

  async finishActiveLot(owner: RoomAuthorizedOwner) {
    const [room, activeLotId, activeBid] = await Promise.all([
      this.roomRepository.getRoom(owner.auctionId),
      this.roomRepository.getActiveLotId(owner.auctionId),
      this.roomRepository.getActiveLotCurrentBid(owner.auctionId),
    ]);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!activeLotId) {
      throw new NotFoundException('No active lot');
    }

    if (!activeBid) {
      await this.lotsService.makeLotUnsold(
        owner.id,
        room.auctionId,
        activeLotId,
      );

      return;
    }

    await Promise.all([
      this.lotsService.makeLotSold(
        owner.id,
        room.auctionId,
        activeLotId,
        activeBid.amount,
      ),
      this.buyersService.saveBuyer(owner.id, room.auctionId, activeLotId, {
        name: activeBid.name,
        email: activeBid.email,
      }),
    ]);
  }

  async placeNextLot(
    owner: RoomAuthorizedOwner,
  ): Promise<
    { lot: RoomLot; autoFinished: false } | { lot: null; autoFinished: true }
  > {
    await this.finishActiveLot(owner);

    const nextLot = await this.roomRepository.getNextLot(owner.auctionId);

    if (!nextLot) {
      await this.completeAuction(owner);
      return { lot: null, autoFinished: true };
    }

    await this.roomRepository.setActiveLot(owner.auctionId, nextLot.id);

    return { lot: nextLot, autoFinished: false };
  }

  async resetAuction(ownerId: string, auctionId: string): Promise<void> {
    const auction = await this.auctionsService.findOne(ownerId, auctionId);

    if (auction.status === AuctionStatus.CREATED) {
      throw new BadRequestException('Auction has not been started yet');
    }

    await this.roomRepository.clearRoom(auctionId);
    await this.auctionsService.resetAuction(ownerId, auctionId);
  }

  async placeBid(
    member: RoomAuthorizedMember,
    bid: CreateBidDto,
  ): Promise<BidDto> {
    const newBid = await this.roomRepository.setBid(
      member.auctionId,
      member,
      bid,
    );

    return newBid;
  }
}
