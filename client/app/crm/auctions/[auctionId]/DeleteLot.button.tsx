'use client';

import {
  useErrorNotification,
  useNotification,
} from '@/src/modules/notifications/NotifcationContext';
import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { useRouter } from 'next/navigation';
import { Lot } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';
import { deleteLot } from '@/src/api/auctions-api-client/requests/lot';
import { Button } from '@/ui-kit/ui/button';
import { Trash2 } from 'lucide-react';

type Props = {
  lot: Lot;
  auctionId: Auction['id'];
};

export const DeleteLotButton = ({ lot, auctionId }: Props) => {
  const { showToast } = useNotification();
  const handleError = useErrorNotification();
  const router = useRouter();

  const handleDelete = async () => {
    const { result } = await confirmModal.show({
      title: 'Delete Lot',
      description: `Do you really want to delete the lot "${lot.name}"?`,
    });

    if (result === 'closed') return;

    try {
      await deleteLot(auctionId, lot.id);

      showToast({
        type: 'success',
        title: 'Lot deleted',
        message: `The lot ${lot.name} has been successfully deleted.`,
      });

      router.refresh();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} title={`Delete lot ${lot.name}`}>
      <Trash2 />
    </Button>
  );
};
