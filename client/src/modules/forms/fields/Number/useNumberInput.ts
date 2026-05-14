import { ChangeEvent, FocusEvent, useEffect, useState } from 'react';

type UseNumberInputOptions = {
  value: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
};

export const useNumberInput = ({
  value,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  onChange,
}: UseNumberInputOptions) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const num = Number(val);

    if (isNaN(num)) return;

    // Hard-block above max immediately — prevents display overflow
    if (num > max) {
      setInputValue(max.toString());
      onChange?.(max);
      return;
    }

    setInputValue(val);
  };

  // Clamp to [min, max] and commit on blur — standard pattern for range inputs
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const num = Number(e.target.value);

    if (isNaN(num) || e.target.value === '') {
      setInputValue(value.toString());
      return;
    }

    const clamped = Math.min(Math.max(num, min), max);
    setInputValue(clamped.toString());
    onChange?.(clamped);
  };

  return { inputValue, handleChange, handleBlur };
};
