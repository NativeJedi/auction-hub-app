import { CreateLotDto, Lot } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';
import { auctionsApiClient } from '@/src/api/auctions-api-client/api';

export const createLot = (auctionId: Auction['id'], lot: CreateLotDto) =>
  auctionsApiClient
    .post<Lot[]>(`/auctions/${auctionId}/lots`, {
      lots: [lot],
    })
    .then((data) => data[0]);

export const deleteLot = (auctionId: Auction['id'], lotId: Lot['id']) =>
  auctionsApiClient.delete(`/auctions/${auctionId}/lots/${lotId}`);

export const fetchLots = (auctionId: Auction['id']) =>
  auctionsApiClient.get<Lot[]>(`/auctions/${auctionId}/lots`);
