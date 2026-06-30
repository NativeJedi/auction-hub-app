'use server';

import {
  ConfirmRoomInviteDto,
  ConfirmRoomInviteResponseDto,
  CreateRoomResponseDto,
  Room,
  SendInviteDto,
} from '@/src/api/dto/room.dto';
import { serverFetch } from '@/src/api/serverFetch';
import {
  getRoomToken,
  missingRoomTokenResponse,
  setRoomTokenCookie,
} from '@/src/api/requests/room';
import type { ServerResponse } from '@/src/api/types';

const ROOM_TOKEN_HEADER_NAME = 'x-room-token';

export const startAuctionAction = async ({
  auctionId,
}: {
  auctionId: Room['auctionId'];
}): Promise<ServerResponse<CreateRoomResponseDto>> => {
  const response = await serverFetch<CreateRoomResponseDto>(`/room/${auctionId}/start`, {
    method: 'POST',
  });

  if ('data' in response) {
    await setRoomTokenCookie(response.data.room.auctionId, response.data.token);
  }

  return response;
};

export const sendRoomInviteAction = async (
  auctionId: Room['auctionId'],
  dto: SendInviteDto
): Promise<ServerResponse<null>> =>
  serverFetch<null>(`/room/${auctionId}/invite`, {
    method: 'POST',
    body: dto,
    skipAuth: true,
  });

export const confirmRoomInviteAction = async (
  auctionId: Room['auctionId'],
  dto: ConfirmRoomInviteDto
): Promise<ServerResponse<ConfirmRoomInviteResponseDto>> => {
  const response = await serverFetch<ConfirmRoomInviteResponseDto>(
    `/room/${auctionId}/invite/confirm`,
    { method: 'POST', body: dto, skipAuth: true }
  );

  if ('data' in response) {
    await setRoomTokenCookie(auctionId, response.data.token);
  }

  return response;
};

export const finishAuctionAction = async ({
  auctionId,
}: {
  auctionId: Room['auctionId'];
}): Promise<ServerResponse<null>> => {
  const roomToken = await getRoomToken(auctionId);

  if (!roomToken) return missingRoomTokenResponse;

  return serverFetch<null>(`/room/${auctionId}/finish`, {
    method: 'POST',
    headers: { [ROOM_TOKEN_HEADER_NAME]: roomToken },
  });
};

export const resetAuctionAction = async ({
  auctionId,
}: {
  auctionId: Room['auctionId'];
}): Promise<ServerResponse<null>> =>
  serverFetch<null>(`/room/${auctionId}/reset`, {
    method: 'POST',
  });
