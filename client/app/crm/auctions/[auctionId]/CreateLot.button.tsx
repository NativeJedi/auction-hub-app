'use client';

import { createLotModal } from '@/app/crm/auctions/[auctionId]/CreateLot.modal';
import { Auction } from '@/src/api/dto/auction.dto';
import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { Plus } from 'lucide-react';
import { Button } from '@/ui-kit/ui/button';
import { lotImagesModal } from '@/app/crm/auctions/[auctionId]/LotImages.modal';

type Props = {
  auctionId: Auction['id'];
};

const CreateLotButton = ({ auctionId }: Props) => {
  const router = useRouter();
  const handleError = useErrorNotification();

  const handleCreateClick = async () => {
    const modalResult = await createLotModal.show({ auctionId, onError: handleError });

    if (modalResult.result === 'closed') {
      return;
    }

    router.refresh();

    const imagesModalResult = await lotImagesModal.show({
      auctionId,
      lot: modalResult.data,
      onError: handleError,
    });

    if (imagesModalResult.result === 'closed') {
      return;
    }

    router.refresh();
  };

  return (
    <Button className="min-w-[100px]" onClick={handleCreateClick}>
      <Plus /> Add
    </Button>
  );
};

export default CreateLotButton;
