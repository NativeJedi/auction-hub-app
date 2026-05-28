'use client';

import { createAuctionModal } from '@/app/crm/auctions/CreateAuction.modal';
import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { createAuction } from '@/src/api/auctions-api-client/requests/auctions';
import { Button } from '@/ui-kit/ui/button';
import { useState } from 'react';

export const CreateAuctionButton = () => {
  const router = useRouter();
  const handleError = useErrorNotification();

  const [loading, setLoading] = useState(false);

  const handleCreateClick = async () => {
    const showResult = await createAuctionModal.show();

    if (showResult.result === 'closed') {
      return;
    }

    const { name, description } = showResult.data;

    try {
      setLoading(true);

      const auction = await createAuction({ name, description });

      router.push(`/crm/auctions/${auction.id}`);
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button loading={loading} onClick={handleCreateClick}>
      Create
    </Button>
  );
};
