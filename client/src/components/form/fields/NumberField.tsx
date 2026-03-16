import { Field, FieldLabel } from '@/ui-kit/ui/field';
import { Input } from '@/ui-kit/ui/input';
import { ChangeEvent, useEffect, useState } from 'react';

type Props = {
  id: string;
  label?: string;
  value: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
};

function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 500,
  readOnly = false,
}: Props) {
  const [internalValue, setInternalValue] = useState('');

  useEffect(() => {
    setInternalValue(value.toString());
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    setInternalValue(val);

    const num = Number(val);

    if (isNaN(num) || !onChange) return;

    if (num < min) onChange(min);
    else if (num > max) onChange(max);
    else onChange(num);
  };

  return (
    <Field>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}

      <Input
        readOnly={readOnly}
        id={id}
        type="number"
        value={internalValue}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
      />
    </Field>
  );
}

export default NumberField;
