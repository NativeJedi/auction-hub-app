import { Room } from '@/src/api/dto/room.dto';

export const setRoomToken = (id: Room['id'], token: string) =>
  localStorage.setItem(`room:${id}:token`, token);

export const getRoomToken = (id: Room['id']) => localStorage.getItem(`room:${id}:token`);
