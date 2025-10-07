'use client';

import { deleteAuction } from '@/src/api/requests/browser/auctions';
import {
  useErrorNotification,
  useNotification,
} from '@/src/modules/notifications/NotifcationContext';
import { Auction } from '@/src/api/dto/auction.dto';
import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { useRouter } from 'next/navigation';

type DeleteAuctionButtonProps = {
  auction: Auction;
};

export const DeleteAuctionButton = ({ auction }: DeleteAuctionButtonProps) => {
  const { showToast } = useNotification();
  const handleError = useErrorNotification();
  const router = useRouter();

  const handleDelete = async () => {
    const { result } = await confirmModal.show({
      title: 'Delete Auction',
      description: `Do you really want to delete the auction "${auction.name}"?`,
    });

    if (result === 'closed') return;

    try {
      await deleteAuction(auction.id);

      showToast({
        type: 'success',
        title: 'Auction deleted',
        message: `The auction ${auction.name} has been successfully deleted.`,
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
