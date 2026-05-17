import { useParams } from 'next/navigation';

export const useAuctionId = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  return auctionId;
};
