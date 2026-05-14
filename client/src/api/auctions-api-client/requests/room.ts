import {
  ConfirmRoomInviteDto,
  ConfirmRoomInviteResponseDto,
  CreateRoomResponseDto,
  Room,
  RoomAdminInfoResponseDto,
  RoomInfoResponseDto,
  SendInviteDto,
} from '@/src/api/dto/room.dto';
import { auctionsApiClient } from '@/src/api/auctions-api-client/api';

export const createRoom = ({ auctionId }: { auctionId: string }) =>
  auctionsApiClient.post<CreateRoomResponseDto>('/room', { auctionId });

export const fetchAdminRoomInfo = ({ roomId }: { roomId: string }) =>
  auctionsApiClient.get<RoomAdminInfoResponseDto>(`/room/${roomId}/admin`);

export const fetchRoomInfo = ({ roomId }: { roomId: string }) =>
  auctionsApiClient.get<RoomInfoResponseDto>(`/room/${roomId}`);

export const sendRoomInvite = (roomId: Room['id'], dto: SendInviteDto) =>
  auctionsApiClient.post(`/room/${roomId}/invite`, dto);

export const confirmRoomInvite = (roomId: Room['id'], dto: ConfirmRoomInviteDto) =>
  auctionsApiClient.post<ConfirmRoomInviteResponseDto>(`/room/${roomId}/invite/confirm`, dto);
