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

export const startAuction = ({ auctionId }: { auctionId: string }) =>
  auctionsApiClient.post<CreateRoomResponseDto>(`/room/${auctionId}/start`);

export const fetchAdminRoomInfo = ({ auctionId }: { auctionId: string }) =>
  auctionsApiClient.get<RoomAdminInfoResponseDto>(`/room/${auctionId}/admin`);

export const fetchRoomInfo = ({ auctionId }: { auctionId: string }) =>
  auctionsApiClient.get<RoomInfoResponseDto>(`/room/${auctionId}`);

export const sendRoomInvite = (auctionId: Room['auctionId'], dto: SendInviteDto) =>
  auctionsApiClient.post(`/room/${auctionId}/invite`, dto);

export const confirmRoomInvite = (auctionId: Room['auctionId'], dto: ConfirmRoomInviteDto) =>
  auctionsApiClient.post<ConfirmRoomInviteResponseDto>(`/room/${auctionId}/invite/confirm`, dto);

export const finishAuction = ({ auctionId }: { auctionId: string }) =>
  auctionsApiClient.post(`/room/${auctionId}/finish`);

export const resetAuction = ({ auctionId }: { auctionId: string }) =>
  auctionsApiClient.post(`/room/${auctionId}/reset`);
