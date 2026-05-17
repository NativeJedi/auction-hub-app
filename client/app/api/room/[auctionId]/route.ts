import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { cookies } from 'next/headers';
import { fetchRoomServer } from '@/src/api/auctions-api/requests/room';

type Options = { params: Promise<{ auctionId: string }> };

const fetchRoom = async (req: Request, { params }: Options) => {
  const { auctionId } = await params;

  const requestCookie = await cookies();

  const roomToken = requestCookie.get(`roomToken:${auctionId}`)?.value;

  const roomInfo = await fetchRoomServer({ auctionId, token: roomToken });

  return NextResponse.json(roomInfo);
};

export const GET = withNextErrorResponse(fetchRoom);
