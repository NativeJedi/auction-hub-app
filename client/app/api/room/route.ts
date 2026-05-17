import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { createRoomServer } from '@/src/api/auctions-api/requests/room';

const createRoom = async (req: Request) => {
  const body = await req.json();

  const data = await createRoomServer(body);

  const response = NextResponse.json(data);

  response.cookies.set(`roomToken:${data.room.auctionId}`, data.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: `/api/room/${data.room.auctionId}/admin`,
  });

  return response;
};

export const POST = withNextErrorResponse(createRoom);
