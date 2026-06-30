import { Auction } from '@/src/api/dto/auction.dto';
import { Lot } from '@/src/api/dto/lot.dto';
import { serverFetch } from '@/src/api/serverFetch';

export const fetchLotsServer = (auctionId: Auction['id']) =>
  serverFetch<Lot[]>(`/auctions/${auctionId}/lots`);
