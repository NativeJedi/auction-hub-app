'use client';

import {
  useErrorNotification,
  useNotification,
} from '@/src/modules/notifications/NotifcationContext';
import { confirmModal } from '@/src/modules/modals/ConfirmModal';
import { Lot } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';
import { deleteLotAction } from '@/src/api/actions/lots.actions';
import { makeSARequest } from '@/src/api/makeSARequest';
import { Button } from '@/ui-kit/ui/button';
import { Trash2 } from 'lucide-react';

const deleteLot = makeSARequest(deleteLotAction);

type Props = {
  lot: Lot;
  auctionId: Auction['id'];
  disabled?: boolean;
};

export const DeleteLotButton = ({ lot, auctionId, disabled }: Props) => {
  const { showToast } = useNotification();
  const handleError = useErrorNotification();

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
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      title={`Delete ${lot.name}`}
      disabled={disabled}
    >
      <Trash2 />
    </Button>
  );
};
