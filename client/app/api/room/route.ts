import { NextResponse } from 'next/server';
import { createRoomServer } from '@/src/api/requests/server/room';
import { withNextErrorResponse } from '@/src/api/core/middlewares';

const createRoom = async (req: Request) => {
  const body = await req.json();

  const data = await createRoomServer(body);

  const response = NextResponse.json(data);

  response.cookies.set(`roomToken:${data.room.id}`, data.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: `/api/room/${data.room.id}/admin`,
  });

  return response;
};

export const POST = withNextErrorResponse(createRoom);
