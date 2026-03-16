import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { useState } from 'react';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';
import { Auction } from '@/src/api/dto/auction.dto';
import TextField from '@/src/components/form/fields/TextField';

type CreatedAuction = Pick<Auction, 'name' | 'description'>;

const CreateAuctionModal = ({ onClose, onSubmit }: ModalControllerProps<CreatedAuction>) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit({ name, description });
    onClose();
  };

  const submit = {
    label: 'Create',
    onClick: handleSubmit,
  };

  return (
    <ModalLayout title="Create Auction" onClose={onClose} submit={submit}>
      <TextField label="Name" placeholder="Auction name" id="name" onChange={setName} />

      <TextField
        label="Description"
        placeholder="Auction description"
        id="description"
        onChange={setDescription}
      />
    </ModalLayout>
  );
};

export const createAuctionModal = createModalRenderer<CreatedAuction>(CreateAuctionModal);
