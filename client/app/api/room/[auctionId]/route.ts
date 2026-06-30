import { withNextErrorResponse } from '@/src/api/middlewares';
import { fetchRoomInfoServer } from '@/src/api/requests/room';

export const GET = withNextErrorResponse(async (_req, { params }) => {
  const { auctionId } = await params;
  return fetchRoomInfoServer(auctionId);
});
