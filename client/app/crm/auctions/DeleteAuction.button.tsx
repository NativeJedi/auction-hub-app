'use client';

import {
  useErrorNotification,
  useNotification,
} from '@/src/modules/notifications/NotifcationContext';
import { Auction } from '@/src/api/dto/auction.dto';
import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { deleteAuctionAction } from '@/src/api/actions/auctions.actions';
import { makeSARequest } from '@/src/api/makeSARequest';
import { Button } from '@/ui-kit/ui/button';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

const deleteAuction = makeSARequest(deleteAuctionAction);

type DeleteAuctionButtonProps = {
  auction: Auction;
};

export const DeleteAuctionButton = ({ auction }: DeleteAuctionButtonProps) => {
  const { showToast } = useNotification();
  const handleError = useErrorNotification();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const { result } = await confirmModal.show({
      title: 'Delete Auction',
      description: `Do you really want to delete the auction "${auction.name}"?`,
    });

    if (result === 'closed') return;

    try {
      setLoading(true);

      await deleteAuction(auction.id);

      showToast({
        type: 'success',
        title: 'Auction deleted',
        message: `The auction ${auction.name} has been successfully deleted.`,
      });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      title={`Delete auction ${auction.name}`}
      loading={loading}
    >
      <Trash2 />
    </Button>
  );
};
