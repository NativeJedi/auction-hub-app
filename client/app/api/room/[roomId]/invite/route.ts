import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { sendRoomInviteServer } from '@/src/api/auctions-api/requests/room';

type Options = { params: Promise<{ roomId: string }> };

const sendRoomInvite = async (req: Request, { params }: Options) => {
  const body = await req.json();
  const { roomId } = await params;

  await sendRoomInviteServer(roomId, body);

  return NextResponse.json({ message: 'Invite sent' });
};

export const POST = withNextErrorResponse(sendRoomInvite);
