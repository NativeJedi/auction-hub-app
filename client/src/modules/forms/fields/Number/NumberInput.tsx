import { ChangeEvent, useEffect, useState } from 'react';
import { Input } from '@/ui-kit/ui/input';

type Props = {
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  value: number;
  placeholder?: string;
  step?: number;
  readOnly?: boolean;
};

const NumberInput = ({
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  disabled,
  onChange,
  value,
  placeholder,
  step,
  readOnly = false,
}: Props) => {
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
    <Input
      readOnly={readOnly}
      type="number"
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      value={internalValue}
      onChange={handleChange}
    />
  );
};

export default NumberInput;
