import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';
import { Auction } from '@/src/api/dto/auction.dto';
import { FormBuilder, FormField } from '@/src/modules/forms';
import { z } from 'zod';

type CreatedAuction = Pick<Auction, 'name' | 'description'>;

const validationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().default(''),
});

const fields: FormField[] = [
  { name: 'name', type: 'text', label: 'Name', placeholder: 'Auction name' },
  { name: 'description', type: 'text', label: 'Description', placeholder: 'Auction description"' },
];

type FormFields = {
  name: string;
  description: string;
};

const CreateAuctionModal = ({ onClose, onSubmit }: ModalControllerProps<CreatedAuction>) => {
  const handleSubmit = (values: FormFields) => {
    onSubmit(values);
    onClose();
  };

  return (
    <ModalLayout title="Create Auction" onClose={onClose}>
      <FormBuilder
        schema={validationSchema}
        fields={fields}
        onSubmit={handleSubmit}
        submitLabel="Create"
      />
    </ModalLayout>
  );
};

export const createAuctionModal = createModalRenderer<CreatedAuction>(CreateAuctionModal);
