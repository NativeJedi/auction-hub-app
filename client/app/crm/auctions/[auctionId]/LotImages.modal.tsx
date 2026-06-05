'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';
import { Skeleton } from '@/ui-kit/ui/skeleton';
import { Auction } from '@/src/api/dto/auction.dto';
import { Lot } from '@/src/api/dto/lot.dto';

type ModalProps = {
  lot: Lot;
  auctionId: Auction['id'];
  onError: (error: unknown) => void;
};

type Props = ModalControllerProps<void, ModalProps>;

const LotImagesContent = dynamic(() => import('./LotImagesContent'), {
  ssr: false,
  loading: () => <Skeleton className="min-h-[100px] w-full" />,
});

const LotImagesModal = ({ lot, auctionId, onClose, onSubmit, onError }: Props) => {
  const [isDirty, setIsDirty] = useState(false);

  const handleClose = () => {
    if (isDirty) {
      onSubmit();
    } else {
      onClose();
    }
  };

  return (
    <ModalLayout onClose={handleClose} title={`${lot.name} — Images`}>
      <LotImagesContent
        lot={lot}
        auctionId={auctionId}
        onError={onError}
        onDirtyChange={setIsDirty}
      />
    </ModalLayout>
  );
};

const lotImagesModal = createModalRenderer<void, ModalProps>(LotImagesModal);

export { lotImagesModal };
