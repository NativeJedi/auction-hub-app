import { useParams, useSearchParams } from 'next/navigation';

export const useRoomId = () => {
  const { roomId } = useParams<{ roomId: string }>();
  return roomId;
};

export const useQueryParam = (name: string) => {
  const searchParams = useSearchParams();

  return searchParams.get(name);
};
