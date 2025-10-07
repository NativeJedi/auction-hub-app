import { NextResponse } from 'next/server';
import { deleteLotServer } from '@/src/api/requests/server/lots';
import { withNextErrorResponse } from '@/src/api/core/middlewares';

type Options = { params: Promise<{ auctionId: string; lotId: string }> };

const deleteLot = async (req: Request, { params }: Options) => {
  const { auctionId, lotId } = await params;

  await deleteLotServer(auctionId, lotId);

  return NextResponse.json({ message: 'Lot deleted successfully' });
};

export const DELETE = withNextErrorResponse(deleteLot);
