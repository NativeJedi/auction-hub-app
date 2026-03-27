import { PickType } from '@nestjs/swagger';
import { LotDto } from '../../lots/dto/lot.dto';

export class RoomLot extends PickType(LotDto, [
  'id',
  'name',
  'description',
  'startPrice',
  'currency',
  'images',
]) {}
