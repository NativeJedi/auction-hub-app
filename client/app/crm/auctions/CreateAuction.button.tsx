'use client';

import { createAuctionModal } from '@/app/crm/auctions/CreateAuction.modal';
import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { createAuction } from '@/src/api/auctions-api-client/requests/auctions';

export const CreateAuctionButton = () => {
  const router = useRouter();
  const handleError = useErrorNotification();

  const handleCreateClick = async () => {
    const showResult = await createAuctionModal.show();

    if (showResult.result === 'closed') {
      return;
    }

    const { name, description } = showResult.data;

    try {
      await createAuction({ name, description });

      router.refresh();
    } catch (error: unknown) {
      handleError(error);
    }
  };

  return (
    <button className="btn btn-primary cursor-pointer" onClick={handleCreateClick}>
      Create Auction
    </button>
  );
};
