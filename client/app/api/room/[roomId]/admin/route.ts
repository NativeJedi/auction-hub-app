import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { cookies } from 'next/headers';
import { fetchRoomAdminServer } from '@/src/api/auctions-api/requests/room';

type Options = { params: Promise<{ roomId: string }> };

const fetchRoomAdmin = async (req: Request, { params }: Options) => {
  const { roomId } = await params;

  const requestCookie = await cookies();

  const roomToken = requestCookie.get(`roomToken:${roomId}`)?.value;

  if (!roomToken) {
    return NextResponse.json({}, { status: 401 });
  }

  const roomInfo = await fetchRoomAdminServer({ roomId, token: roomToken || '' });

  return NextResponse.json(roomInfo);
};

export const GET = withNextErrorResponse(fetchRoomAdmin);
