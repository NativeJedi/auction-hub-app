import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { cookies } from 'next/headers';
import { fetchRoomServer } from '@/src/api/auctions-api/requests/room';

type Options = { params: Promise<{ roomId: string }> };

const fetchRoom = async (req: Request, { params }: Options) => {
  const { roomId } = await params;

  const requestCookie = await cookies();

  const roomToken = requestCookie.get(`roomToken:${roomId}`)?.value;

  const roomInfo = await fetchRoomServer({ roomId, token: roomToken });

  return NextResponse.json(roomInfo);
};

export const GET = withNextErrorResponse(fetchRoom);
