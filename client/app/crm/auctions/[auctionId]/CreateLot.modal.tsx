'use client';

import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { useState } from 'react';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';
import { CreateLotDto, Currency } from '@/src/api/dto/lot.dto';
import TextField from '@/src/components/form/fields/TextField';
import { Dropdown } from '@/src/components/form/fields/Dropdown';
import NumberField from '@/src/components/form/fields/NumberField';

const options = Object.values(Currency).map((currency) => ({
  label: currency,
  value: currency,
}));

const CreateLotModal = ({ onClose, onSubmit }: ModalControllerProps<CreateLotDto>) => {
  const [fields, setFields] = useState({
    name: '',
    description: '',
    startPrice: 0,
    currency: Currency.UAH,
  });

  const handleChangeField = (field: keyof CreateLotDto) => (value: string | number) =>
    setFields((prev) => ({
      ...prev,
      [field]: value,
    }));

  const submit = {
    label: 'Create',
    onClick: () => {
      onSubmit(fields);
      onClose();
    },
  };

  return (
    <ModalLayout title="Create Lot" onClose={onClose} submit={submit}>
      <TextField
        label="Name"
        placeholder="Lot name"
        id="name"
        onChange={handleChangeField('name')}
      />

      <TextField
        label="Description"
        placeholder="Lot description"
        id="description"
        onChange={handleChangeField('description')}
      />

      <Dropdown
        id="currency"
        label="Currency"
        options={options}
        value={fields.currency}
        onChange={handleChangeField('currency')}
      />

      <NumberField
        value={fields.startPrice}
        label="Start Price"
        placeholder="Start Price"
        id="startPrice"
        onChange={handleChangeField('startPrice')}
      />
    </ModalLayout>
  );
};

export const createLotModal = createModalRenderer<CreateLotDto>(CreateLotModal);
