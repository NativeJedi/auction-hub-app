import { Input } from '@/ui-kit/ui/input';
import { useNumberInput } from './useNumberInput';

type Props = {
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  value: number;
  placeholder?: string;
  step?: number;
  readOnly?: boolean;
  className?: string;
};

const NumberInput = ({
  min,
  max,
  disabled,
  onChange,
  value,
  placeholder,
  step,
  readOnly = false,
  className,
}: Props) => {
  const { inputValue, handleChange, handleBlur } = useNumberInput({ value, min, max, onChange });

  return (
    <Input
      readOnly={readOnly}
      type="number"
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};

export default NumberInput;
