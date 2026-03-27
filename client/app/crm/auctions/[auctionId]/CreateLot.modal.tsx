'use client';

import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';
import { Currency, Lot } from '@/src/api/dto/lot.dto';
import { FormBuilder, FormField } from '@/src/modules/forms';
import { z } from 'zod';
import { createLots } from '@/src/api/auctions-api-client/requests/lots';
import { Auction } from '@/src/api/dto/auction.dto';

const options = Object.values(Currency).map((currency) => ({
  label: currency,
  value: currency,
}));

const fields: FormField[] = [
  { name: 'name', type: 'text', label: 'Name', placeholder: 'Lot name' },
  { name: 'description', type: 'text', label: 'Description', placeholder: 'Lot description"' },
  { name: 'startPrice', type: 'number', label: 'Start Price', placeholder: 'Start Price' },
  { name: 'currency', type: 'select', label: 'Currency', options },
];

const validationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().default(''),
  startPrice: z.number().min(0, 'Start price must be greater than 0'),
  currency: z.enum(Object.values(Currency)),
});

type FormFields = {
  name: string;
  description: string;
  startPrice: number;
  currency: Currency;
};

type CreateLotModalProps = {
  auctionId: Auction['id'];
  onError: (error: unknown) => void;
};

type Props = ModalControllerProps<Lot> & CreateLotModalProps;

const CreateLotModal = ({ auctionId, onClose, onSubmit, onError }: Props) => {
  const handleSubmit = async (fields: FormFields) => {
    try {
      const lots = await createLots(auctionId, fields);

      onSubmit(lots[0]);
    } catch (error) {
      onError(error);
    }
  };

  return (
    <ModalLayout title="Create Lot" onClose={onClose}>
      <FormBuilder
        schema={validationSchema}
        fields={fields}
        submitLabel="Create"
        onSubmit={handleSubmit}
      />
    </ModalLayout>
  );
};

export const createLotModal = createModalRenderer<Lot, CreateLotModalProps>(CreateLotModal);
