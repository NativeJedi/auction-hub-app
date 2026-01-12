import { Auction, CreateAuctionDto } from '@/src/api/dto/auction.dto';
import { auctionsApiClient } from '@/src/api/auctions-api-client/api';

export const createAuction = (params: CreateAuctionDto) =>
  auctionsApiClient.post<Auction>('/auctions', params);

export const deleteAuction = (id: Auction['id']) => auctionsApiClient.delete(`/auctions/${id}`);

export const fetchAuctionById = (id: Auction['id']) =>
  auctionsApiClient.get<Auction>(`/auctions/${id}`);
