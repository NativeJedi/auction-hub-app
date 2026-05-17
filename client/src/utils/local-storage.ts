import { Room } from '@/src/api/dto/room.dto';

export const setRoomToken = (auctionId: Room['auctionId'], token: string) =>
  localStorage.setItem(`room:${auctionId}:token`, token);

export const getRoomToken = (auctionId: Room['auctionId']) => localStorage.getItem(`room:${auctionId}:token`);
