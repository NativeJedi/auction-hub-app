import { Auction } from '@/src/api/dto/auction.dto';
import {
  AddLotImagesDto,
  CreateLotDto,
  Lot,
  LotImage,
  PresignedUrlsResponseDto,
} from '@/src/api/dto/lot.dto';
import { auctionsAPI } from '@/src/api/auctions-api/api';

export const fetchLotsServer = (auctionId: Auction['id']) =>
  auctionsAPI.get<Lot[]>(`/auctions/${auctionId}/lots`);

export const createLotsServer = (
  auctionId: Auction['id'],
  body: {
    lots: CreateLotDto[];
  }
) => auctionsAPI.post<Lot[]>(`/auctions/${auctionId}/lots`, body);

export const deleteLotServer = (auctionId: Auction['id'], lotId: Lot['id']) =>
  auctionsAPI.delete(`/auctions/${auctionId}/lots/${lotId}`);

export const presignLotImagesServer = (auctionId: Auction['id'], lotId: Lot['id'], count: number) =>
  auctionsAPI.post<PresignedUrlsResponseDto>(
    `/auctions/${auctionId}/lots/${lotId}/images/presign`,
    {
      count,
    }
  );

export const addLotImagesServer = (
  auctionId: Auction['id'],
  lotId: Lot['id'],
  body: AddLotImagesDto
) => auctionsAPI.post<LotImage[]>(`/auctions/${auctionId}/lots/${lotId}/images`, body);

export const deleteLotImageServer = (
  auctionId: Auction['id'],
  lotId: Lot['id'],
  imageId: LotImage['id']
) => auctionsAPI.delete(`/auctions/${auctionId}/lots/${lotId}/images/${imageId}`);
