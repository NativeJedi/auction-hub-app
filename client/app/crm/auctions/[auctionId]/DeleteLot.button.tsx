'use client';

import {
  useErrorNotification,
  useNotification,
} from '@/src/modules/notifications/NotifcationContext';
import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { useRouter } from 'next/navigation';
import { Lot } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';
import { deleteLot } from '@/src/api/requests/browser/lot';

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
    <button
      onClick={handleDelete}
      className="group relative p-1 rounded cursor-pointer hover:bg-gray-100"
      title="Delete auction"
    >
      🗑️
    </button>
  );
};
