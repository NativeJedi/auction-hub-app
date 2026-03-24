import {
  AddLotImagesDto,
  CreateLotDto,
  Lot,
  LotImage,
  PresignedUrlsResponseDto,
} from '@/src/api/dto/lot.dto';
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

const presignLotImages = (auctionId: Auction['id'], lotId: Lot['id'], count: number) =>
  auctionsApiClient.post<PresignedUrlsResponseDto>(
    `/auctions/${auctionId}/lots/${lotId}/images/presign`,
    { count }
  );

const addLotImages = (auctionId: Auction['id'], lotId: Lot['id'], body: AddLotImagesDto) =>
  auctionsApiClient.post<LotImage[]>(`/auctions/${auctionId}/lots/${lotId}/images`, body);

export const deleteLotImage = (
  auctionId: Auction['id'],
  lotId: Lot['id'],
  imageId: LotImage['id']
) => auctionsApiClient.delete(`/auctions/${auctionId}/lots/${lotId}/images/${imageId}`);

export const uploadLotImages = async (
  auctionId: Auction['id'],
  lotId: Lot['id'],
  files: File[]
): Promise<LotImage[]> => {
  const presignResults = await presignLotImages(auctionId, lotId, files.length);

  await Promise.all(
    presignResults.map(({ presignedUrl }, i) =>
      fetch(presignedUrl, {
        method: 'PUT',
        body: files[i],
        headers: { 'Content-Type': 'image/webp' },
      }).then((res) => {
        if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      })
    )
  );

  return addLotImages(auctionId, lotId, {
    images: presignResults.map(({ s3Key }, i) => ({
      s3Key,
    })),
  });
};
