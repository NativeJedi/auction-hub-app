import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { confirmRoomInviteServer } from '@/src/api/auctions-api/requests/room';

type Options = { params: Promise<{ auctionId: string }> };

const confirmRoomInvite = async (req: Request, { params }: Options) => {
  const body = await req.json();

  const { auctionId } = await params;

  const data = await confirmRoomInviteServer(auctionId, body);

  const response = NextResponse.json(data);

  response.cookies.set(`roomToken:${auctionId}`, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: `/api/room/${auctionId}`,
  });

  return response;
};

export const POST = withNextErrorResponse(confirmRoomInvite);
