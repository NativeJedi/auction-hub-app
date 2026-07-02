'use client';

import { useState } from 'react';
import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui-kit/ui/button';
import { RotateCcwIcon } from 'lucide-react';
import { makeSARequest } from '@/src/api/makeSARequest';
import { resetAuctionAction } from '@/src/api/actions/room.actions';

const resetAuction = makeSARequest(resetAuctionAction);
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';

const ResetAuctionButton = ({ auctionId }: { auctionId: string }) => {
  const router = useRouter();
  const onError = useErrorNotification();
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    const { result } = await confirmModal.show({
      title: 'Reset Auction?',
      description:
        'This will clear all bids, reset all lots to their initial state, and remove buyer records. The auction will return to CREATED status.',
    });

    if (result === 'closed') return;

    setIsLoading(true);

    try {
      await resetAuction({ auctionId });
      router.refresh();
    } catch (error) {
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleReset} loading={isLoading} size="sm">
      <RotateCcwIcon className="size-4" />
      Reset
    </Button>
  );
};

export default ResetAuctionButton;
