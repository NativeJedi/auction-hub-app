'use server';

import { revalidatePath } from 'next/cache';
import { Auction, CreateAuctionDto } from '@/src/api/dto/auction.dto';
import { serverFetch } from '@/src/api/serverFetch';

const AUCTIONS_PATH = '/crm/auctions';

const isSuccess = (status: number) => status >= 200 && status < 300;

export const createAuctionAction = async (input: CreateAuctionDto) => {
  const response = await serverFetch<Auction>('/auctions', { method: 'POST', body: input });

  if (isSuccess(response.status)) {
    revalidatePath(AUCTIONS_PATH);
  }

  return response;
};

export const deleteAuctionAction = async (id: Auction['id']) => {
  const response = await serverFetch<null>(`/auctions/${id}`, { method: 'DELETE' });

  if (isSuccess(response.status)) {
    revalidatePath(AUCTIONS_PATH);
  }

  return response;
};
