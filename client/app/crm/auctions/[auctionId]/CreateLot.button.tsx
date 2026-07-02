'use client';

import { createLotModal } from '@/app/crm/auctions/[auctionId]/CreateLot.modal';
import { Auction } from '@/src/api/dto/auction.dto';
import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { Plus } from 'lucide-react';
import { Button } from '@/ui-kit/ui/button';
import { lotImagesModal } from './components/LotImages/LotImages.modal';
import { PropsWithChildren, useState } from 'react';

type Props = PropsWithChildren<{
  auctionId: Auction['id'];
  disabled?: boolean;
}>;

const CreateLotButton = ({ auctionId, disabled, children }: Props) => {
  const router = useRouter();
  const handleError = useErrorNotification();

  const handleCreateClick = async () => {
    const modalResult = await createLotModal.show({ auctionId, onError: handleError });

    if (modalResult.result === 'closed') {
      return;
    }

    await lotImagesModal.show({
      auctionId,
      lot: modalResult.data,
      onError: handleError,
    });

    router.refresh();
  };

  return (
    <Button size="sm" onClick={handleCreateClick} disabled={disabled}>
      {children || (
        <>
          <Plus /> Add lot
        </>
      )}
    </Button>
  );
};

export default CreateLotButton;
