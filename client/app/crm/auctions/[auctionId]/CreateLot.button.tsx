'use client';

import { createLotModal } from '@/app/crm/auctions/[auctionId]/CreateLot.modal';
import { Auction } from '@/src/api/dto/auction.dto';
import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { createLot } from '@/src/api/auctions-api-client/requests/lot';

type Props = {
  auctionId: Auction['id'];
};

const CreateLotButton = ({ auctionId }: Props) => {
  const router = useRouter();
  const handleError = useErrorNotification();

  const handleCreateClick = async () => {
    const modalResult = await createLotModal.show();

    if (modalResult.result === 'closed') {
      return;
    }

    try {
      await createLot(auctionId, modalResult.data);

      router.refresh();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <button className="btn btn-primary min-w-35" onClick={handleCreateClick}>
      Create lot
    </button>
  );
};

export default CreateLotButton;
