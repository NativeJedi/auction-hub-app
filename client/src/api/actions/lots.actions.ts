'use server';

import { revalidatePath } from 'next/cache';
import { Auction } from '@/src/api/dto/auction.dto';
import {
  AddLotImagesDto,
  CreateLotDto,
  Lot,
  LotImage,
  PresignedUrlsResponseDto,
} from '@/src/api/dto/lot.dto';
import { serverFetch } from '@/src/api/serverFetch';
import type { ServerResponse } from '@/src/api/types';

const auctionPath = (auctionId: Auction['id']) => `/crm/auctions/${auctionId}`;
const isSuccess = (status: number) => status >= 200 && status < 300;

export const createLotsAction = async (
  auctionId: Auction['id'],
  lot: CreateLotDto
): Promise<ServerResponse<Lot[]>> => {
  const response = await serverFetch<Lot[]>(`/auctions/${auctionId}/lots`, {
    method: 'POST',
    body: { lots: [lot] },
  });

  if (isSuccess(response.status)) {
    revalidatePath(auctionPath(auctionId));
  }

  return response;
};

export const deleteLotAction = async (
  auctionId: Auction['id'],
  lotId: Lot['id']
): Promise<ServerResponse<null>> => {
  const response = await serverFetch<null>(`/auctions/${auctionId}/lots/${lotId}`, {
    method: 'DELETE',
  });

  if (isSuccess(response.status)) {
    revalidatePath(auctionPath(auctionId));
  }

  return response;
};

export const presignLotImagesAction = async (
  auctionId: Auction['id'],
  lotId: Lot['id'],
  count: number
): Promise<ServerResponse<PresignedUrlsResponseDto>> =>
  serverFetch<PresignedUrlsResponseDto>(`/auctions/${auctionId}/lots/${lotId}/images/presign`, {
    method: 'POST',
    body: { count },
  });

export const addLotImagesAction = async (
  auctionId: Auction['id'],
  lotId: Lot['id'],
  body: AddLotImagesDto
): Promise<ServerResponse<LotImage[]>> =>
  serverFetch<LotImage[]>(`/auctions/${auctionId}/lots/${lotId}/images`, {
    method: 'POST',
    body,
  });

export const deleteLotImageAction = async (
  auctionId: Auction['id'],
  lotId: Lot['id'],
  imageId: LotImage['id']
): Promise<ServerResponse<null>> =>
  serverFetch<null>(`/auctions/${auctionId}/lots/${lotId}/images/${imageId}`, {
    method: 'DELETE',
  });
