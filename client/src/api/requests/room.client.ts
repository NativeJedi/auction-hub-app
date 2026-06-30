import { clientFetch } from '@/src/api/clientFetch';
import type { Room, RoomAdminInfoResponseDto, RoomInfoResponseDto } from '@/src/api/dto/room.dto';

export const fetchRoomInfo = ({ auctionId }: { auctionId: Room['auctionId'] }) =>
  clientFetch<RoomInfoResponseDto>(`/room/${auctionId}`);

export const fetchAdminRoomInfo = ({ auctionId }: { auctionId: Room['auctionId'] }) =>
  clientFetch<RoomAdminInfoResponseDto>(`/room/${auctionId}/admin`);
