import {
  ConfirmRoomInviteDto,
  ConfirmRoomInviteResponseDto,
  CreateRoomResponseDto,
  Room,
  RoomAdminInfoResponseDto,
  RoomMemberInfoResponseDto,
  SendInviteDto,
} from '@/src/api/dto/room.dto';
import { apiClient } from '@/src/api/clients/api-client';

export const createRoom = ({ auctionId }: { auctionId: string }) =>
  apiClient.post<CreateRoomResponseDto>('/room', { auctionId });

export const fetchAdminRoomInfo = ({ roomId }: { roomId: string }) =>
  apiClient.get<RoomAdminInfoResponseDto>(`/room/${roomId}/admin`);

export const fetchMemberRoomInfo = ({ roomId }: { roomId: string }) =>
  apiClient.get<RoomMemberInfoResponseDto>(`/room/${roomId}/member`);

export const sendRoomInvite = (roomId: Room['id'], dto: SendInviteDto) =>
  apiClient.post(`/room/${roomId}/invite`, dto);

export const confirmRoomInvite = (roomId: Room['id'], dto: ConfirmRoomInviteDto) =>
  apiClient.post<ConfirmRoomInviteResponseDto>(`/room/${roomId}/invite/confirm`, dto);
