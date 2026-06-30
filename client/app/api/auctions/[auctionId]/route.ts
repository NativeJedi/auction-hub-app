import { withNextErrorResponse } from '@/src/api/middlewares';
import { fetchAuctionByIdServer } from '@/src/api/requests/auctions';

export const GET = withNextErrorResponse(async (_req, { params }) => {
  const { auctionId } = await params;
  return fetchAuctionByIdServer(auctionId);
});
