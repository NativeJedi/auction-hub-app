import {
  ConfirmRoomInviteDto,
  ConfirmRoomInviteResponseDto,
  CreateRoomResponseDto,
  Room,
  RoomAdminInfoResponseDto,
  RoomMemberInfoResponseDto,
  SendInviteDto,
} from '@/src/api/dto/room.dto';
import { auctionsAPI } from '@/src/api/auctions-api/api';

export const createRoomServer = ({ auctionId }: { auctionId: string }) =>
  auctionsAPI.post<CreateRoomResponseDto>('/room', { auctionId });

export const fetchRoomAdminServer = ({ roomId, token }: { roomId: string; token: string }) =>
  auctionsAPI.get<RoomAdminInfoResponseDto>(`/room/${roomId}/admin`, {
    headers: {
      ['x-room-token']: token,
    },
  });

export const fetchRoomMemberServer = ({ roomId, token }: { roomId: string; token: string }) =>
  auctionsAPI.get<RoomMemberInfoResponseDto>(`/room/${roomId}/member`, {
    headers: {
      ['x-room-token']: token,
    },
  });

export const sendRoomInviteServer = (id: Room['id'], dto: SendInviteDto) =>
  auctionsAPI.post(`/room/${id}/invite`, dto);

export const confirmRoomInviteServer = (id: Room['id'], dto: ConfirmRoomInviteDto) =>
  auctionsAPI.post<ConfirmRoomInviteResponseDto>(`/room/${id}/invite/confirm`, dto);
