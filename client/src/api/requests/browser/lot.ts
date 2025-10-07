import { CreateLotDto, Lot } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';
import { apiClient } from '@/src/api/clients/api-client';

export const createLot = (auctionId: Auction['id'], lot: CreateLotDto) =>
  apiClient
    .post<Lot[]>(`/auctions/${auctionId}/lots`, {
      lots: [lot],
    })
    .then((data) => data[0]);

export const deleteLot = (auctionId: Auction['id'], lotId: Lot['id']) =>
  apiClient.delete(`/auctions/${auctionId}/lots/${lotId}`);

export const fetchLots = (auctionId: Auction['id']) =>
  apiClient.get<Lot[]>(`/auctions/${auctionId}/lots`);
