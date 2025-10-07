import { Auction } from '@/src/api/dto/auction.dto';
import { CreateLotDto, Lot } from '@/src/api/dto/lot.dto';
import { auctionsAPI } from '@/src/api/clients/auctions-api';

export const fetchLotsServer = (auctionId: Auction['id']) =>
  auctionsAPI.get<Lot[]>(`/auctions/${auctionId}/lots`);

export const createLotServer = (
  auctionId: Auction['id'],
  body: {
    lots: CreateLotDto[];
  }
) => auctionsAPI.post<Lot[]>(`/auctions/${auctionId}/lots`, body).then((data) => data[0]);

export const deleteLotServer = (auctionId: Auction['id'], lotId: Lot['id']) =>
  auctionsAPI.delete(`/auctions/${auctionId}/lots/${lotId}`);
