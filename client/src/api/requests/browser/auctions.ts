import { Auction, CreateAuctionDto } from '@/src/api/dto/auction.dto';
import { apiClient } from '@/src/api/clients/api-client';

export const createAuction = (params: CreateAuctionDto) =>
  apiClient.post<Auction>('/auctions', params);

export const deleteAuction = (id: Auction['id']) => apiClient.delete(`/auctions/${id}`);

export const fetchAuctionById = (id: Auction['id']) => apiClient.get<Auction>(`/auctions/${id}`);
