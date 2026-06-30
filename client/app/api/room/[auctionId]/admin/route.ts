import { withNextErrorResponse } from '@/src/api/middlewares';
import { fetchAdminRoomInfoServer } from '@/src/api/requests/room';

export const GET = withNextErrorResponse(async (_req, { params }) => {
  const { auctionId } = await params;
  return fetchAdminRoomInfoServer(auctionId);
});
