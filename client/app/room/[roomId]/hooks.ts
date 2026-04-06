import { useParams, useSearchParams } from 'next/navigation';

export const useRoomId = () => {
  const { roomId } = useParams<{ roomId: string }>();
  return roomId;
};
