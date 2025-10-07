import { NextResponse } from 'next/server';
import { fetchRoomAdminServer } from '@/src/api/requests/server/room';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { cookies } from 'next/headers';

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
