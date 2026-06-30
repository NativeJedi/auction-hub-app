import { cookies } from 'next/headers';
import { serverFetch } from '@/src/api/serverFetch';
import type { Room, RoomAdminInfoResponseDto, RoomInfoResponseDto } from '@/src/api/dto/room.dto';
import type { ErrorServerResponse, ServerResponse } from '@/src/api/types';

const ROOM_TOKEN_HEADER_NAME = 'x-room-token';

const roomTokenCookieName = (auctionId: Room['auctionId']) => `roomToken:${auctionId}`;

const ROOM_TOKEN_COOKIE_SETTINGS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export const missingRoomTokenResponse: ErrorServerResponse = {
  status: 401,
  message: 'Room token is missing',
  reason: 'UNAUTHORIZED',
};

export const getRoomToken = async (auctionId: Room['auctionId']) =>
  (await cookies()).get(roomTokenCookieName(auctionId))?.value;

export const setRoomTokenCookie = async (auctionId: Room['auctionId'], token: string) =>
  (await cookies()).set(roomTokenCookieName(auctionId), token, ROOM_TOKEN_COOKIE_SETTINGS);

export const fetchAdminRoomInfoServer = async (
  auctionId: Room['auctionId']
): Promise<ServerResponse<RoomAdminInfoResponseDto>> => {
  const roomToken = await getRoomToken(auctionId);

  if (!roomToken) return missingRoomTokenResponse;

  return serverFetch<RoomAdminInfoResponseDto>(`/room/${auctionId}/admin`, {
    headers: { [ROOM_TOKEN_HEADER_NAME]: roomToken },
  });
};

export const fetchRoomInfoServer = async (
  auctionId: Room['auctionId']
): Promise<ServerResponse<RoomInfoResponseDto>> => {
  const roomToken = await getRoomToken(auctionId);

  return serverFetch<RoomInfoResponseDto>(`/room/${auctionId}`, {
    skipAuth: true,
    headers: roomToken ? { [ROOM_TOKEN_HEADER_NAME]: roomToken } : undefined,
  });
};
