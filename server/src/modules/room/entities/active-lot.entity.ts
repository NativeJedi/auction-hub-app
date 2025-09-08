import { Lot } from '../../lots/entities/lots.entity';
import { PickType } from '@nestjs/swagger';
import { Room } from './room.entity';
import { Auction } from '../../auctions/entities/auction.entity';
import { Member } from './member.entity';

export class BidEntity extends PickType(Member, ['id', 'name', 'email']) {
  amount: number;
}

export class ActiveLot extends PickType(Lot, [
  'id',
  'name',
  'description',
  'startPrice',
  'currency',
]) {
  roomId: Room['id'];

  auctionId: Auction['id'];

  bid?: BidEntity;
}
