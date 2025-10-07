import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { useState } from 'react';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';
import TextField from '@/src/ui/components/TextField';
import { Auction } from '@/src/api/dto/auction.dto';

type CreatedAuction = Pick<Auction, 'name' | 'description'>;

const CreateAuctionModal = ({ onClose, onSubmit }: ModalControllerProps<CreatedAuction>) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit({ name, description });
    onClose();
  };

  return (
    <ModalLayout title="Create Auction" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <TextField label="Name" placeholder="Auction name" id="name" onChange={setName} />

        <TextField
          label="Description"
          placeholder="Auction description"
          id="description"
          onChange={setDescription}
        />

        <div className="modal-action justify-end gap-2">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Create
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

export const createAuctionModal = createModalRenderer<CreatedAuction>(CreateAuctionModal);
