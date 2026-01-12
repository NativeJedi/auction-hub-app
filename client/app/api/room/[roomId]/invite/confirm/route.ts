import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { confirmRoomInviteServer } from '@/src/api/auctions-api/requests/room';

type Options = { params: Promise<{ roomId: string }> };

const confirmRoomInvite = async (req: Request, { params }: Options) => {
  const body = await req.json();

  const { roomId } = await params;

  const data = await confirmRoomInviteServer(roomId, body);

  const response = NextResponse.json(data);

  response.cookies.set(`roomToken:${roomId}`, data.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: `/api/room/${roomId}/member`,
  });

  return response;
};

export const POST = withNextErrorResponse(confirmRoomInvite);
