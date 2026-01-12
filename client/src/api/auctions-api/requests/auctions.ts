import { PaginatedResponseDto } from '@/src/api/dto/pagination.dto';
import { Auction } from '@/src/api/dto/auction.dto';
import { auctionsAPI } from '@/src/api/auctions-api/api';

type AuctionsResponse = PaginatedResponseDto<Auction>;

export const fetchAuctionsServer = ({
  page = 1,
  limit = 10,
}: {
  page?: number | string;
  limit?: number | string;
} = {}) =>
  auctionsAPI.get<AuctionsResponse>('/auctions', {
    params: { page, limit },
  });

export const createAuctionServer = (params: Pick<Auction, 'name' | 'description'>) =>
  auctionsAPI.post<Auction>('/auctions', params);

export const deleteAuctionServer = (id: Auction['id']) => auctionsAPI.delete(`/auctions/${id}`);

export const fetchAuctionByIdServer = (id: Auction['id']) =>
  auctionsAPI.get<Auction>(`/auctions/${id}`);
