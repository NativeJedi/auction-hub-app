import { useParams } from 'next/navigation';

export const useRoomId = () => {
  const { roomId } = useParams<{ roomId: string }>();
  return roomId;
};
