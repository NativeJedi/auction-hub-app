'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/ui-kit/ui/button';
import { Images } from 'lucide-react';
import { lotImagesModal } from '@/app/crm/auctions/[auctionId]/LotImages.modal';
import { Lot } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';
import {
  useErrorNotification,
  useNotification,
} from '@/src/modules/notifications/NotifcationContext';

type Props = {
  lot: Lot;
  auctionId: Auction['id'];
};

const ManageLotImagesButton = ({ lot, auctionId }: Props) => {
  const { showToast } = useNotification();
  const handleError = useErrorNotification();
  const router = useRouter();

  const handleClick = async () => {
    const modalResult = await lotImagesModal.show({ lot, auctionId, onError: handleError });

    if (modalResult.result === 'closed') {
      return;
    }

    const { uploadedCount } = modalResult.data;

    showToast({
      type: 'success',
      title: 'Images uploaded',
      message: `${uploadedCount} image${uploadedCount > 1 ? 's' : ''} uploaded successfully.`,
    });

    router.refresh();
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} title={`Manage ${lot.name} images`}>
      <Images />
    </Button>
  );
};

export default ManageLotImagesButton;
