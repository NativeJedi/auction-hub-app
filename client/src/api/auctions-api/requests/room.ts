import {
  ConfirmRoomInviteDto,
  ConfirmRoomInviteResponseDto,
  CreateRoomResponseDto,
  Room,
  RoomAdminInfoResponseDto,
  RoomInfoResponseDto,
  SendInviteDto,
} from '@/src/api/dto/room.dto';
import { auctionsAPI } from '@/src/api/auctions-api/api';

export const createRoomServer = ({ auctionId }: { auctionId: string }) =>
  auctionsAPI.post<CreateRoomResponseDto>('/room', { auctionId });

export const fetchRoomAdminServer = ({ auctionId, token }: { auctionId: string; token: string }) =>
  auctionsAPI.get<RoomAdminInfoResponseDto>(`/room/${auctionId}/admin`, {
    headers: {
      ['x-room-token']: token,
    },
  });

export const fetchRoomServer = ({ auctionId, token }: { auctionId: string; token?: string }) =>
  auctionsAPI.get<RoomInfoResponseDto>(`/room/${auctionId}`, {
    headers: token ? { ['x-room-token']: token } : {},
    skipAuth: true,
  });

export const sendRoomInviteServer = (auctionId: Room['auctionId'], dto: SendInviteDto) =>
  auctionsAPI.post(`/room/${auctionId}/invite`, dto, { skipAuth: true });

export const confirmRoomInviteServer = (auctionId: Room['auctionId'], dto: ConfirmRoomInviteDto) =>
  auctionsAPI.post<ConfirmRoomInviteResponseDto>(`/room/${auctionId}/invite/confirm`, dto, {
    skipAuth: true,
  });
