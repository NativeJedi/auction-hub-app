import { RoomRole } from '../../../guards/room-roles/room-roles.constants';

export class Member {
  id: string;
  name?: string;
  email: string;
  auctionId: string;
  roomId: string;
  role: RoomRole;
}
