import { PaginatedResponseDto } from '@/src/api/dto/pagination.dto';
import { Auction } from '@/src/api/dto/auction.dto';
import { AuctionResults } from '@/src/api/dto/auction-results.dto';
import { serverFetch } from '@/src/api/serverFetch';

export const fetchAuctionsServer = ({
  page = 1,
  limit = 10,
}: {
  page?: number | string;
  limit?: number | string;
} = {}) =>
  serverFetch<PaginatedResponseDto<Auction>>('/auctions', {
    params: { page, limit },
  });

export const fetchAuctionByIdServer = (id: Auction['id']) =>
  serverFetch<Auction>(`/auctions/${id}`);

export const fetchAuctionResultsServer = (id: Auction['id']) =>
  serverFetch<AuctionResults>(`/auctions/${id}/results`, { skipAuth: true });
