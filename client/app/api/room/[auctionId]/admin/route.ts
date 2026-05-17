import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { cookies } from 'next/headers';
import { fetchRoomAdminServer } from '@/src/api/auctions-api/requests/room';

type Options = { params: Promise<{ auctionId: string }> };

const fetchRoomAdmin = async (req: Request, { params }: Options) => {
  const { auctionId } = await params;

  const requestCookie = await cookies();

  const roomToken = requestCookie.get(`roomToken:${auctionId}`)?.value;

  if (!roomToken) {
    return NextResponse.json({}, { status: 401 });
  }

  const roomInfo = await fetchRoomAdminServer({ auctionId, token: roomToken || '' });

  return NextResponse.json(roomInfo);
};

export const GET = withNextErrorResponse(fetchRoomAdmin);
