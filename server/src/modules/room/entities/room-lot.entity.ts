import { PickType } from '@nestjs/swagger';
import { Lot } from '../../lots/entities/lots.entity';

export class RoomLot extends PickType(Lot, [
  'id',
  'name',
  'description',
  'startPrice',
  'currency',
]) {}
