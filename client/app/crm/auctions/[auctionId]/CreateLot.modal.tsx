'use client';

import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';
import { CreateLotDto, Currency } from '@/src/api/dto/lot.dto';
import { FormBuilder, FormField } from '@/src/modules/forms';
import { z } from 'zod';

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

const CreateLotModal = ({ onClose, onSubmit }: ModalControllerProps<CreateLotDto>) => {
  const handleSubmit = (fields: FormFields) => {
    onSubmit(fields);
    onClose();
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

export const createLotModal = createModalRenderer<CreateLotDto>(CreateLotModal);
