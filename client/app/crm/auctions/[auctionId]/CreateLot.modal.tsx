'use client';

import dynamic from 'next/dynamic';
import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';
import { Skeleton } from '@/ui-kit/ui/skeleton';
import { Lot } from '@/src/api/dto/lot.dto';
import { Auction } from '@/src/api/dto/auction.dto';

type CreateLotModalProps = {
  auctionId: Auction['id'];
  onError: (error: unknown) => void;
};

type Props = ModalControllerProps<Lot> & CreateLotModalProps;

const CreateLotForm = dynamic(() => import('./CreateLotForm'), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full" />,
});

const CreateLotModal = ({ auctionId, onClose, onSubmit, onError }: Props) => (
  <ModalLayout title="Create Lot" onClose={onClose}>
    <CreateLotForm auctionId={auctionId} onClose={onClose} onSubmit={onSubmit} onError={onError} />
  </ModalLayout>
);

export const createLotModal = createModalRenderer<Lot, CreateLotModalProps>(CreateLotModal);
