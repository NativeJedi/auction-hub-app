import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-kit/ui/select';
import { Field, FieldLabel } from '@/ui-kit/ui/field';

type Option = {
  value: string | number;
  label: string;
};

interface DropdownProps {
  id: string;
  label: string;
  options: Option[];
  value: Option['value'];
  onChange: (value: Option['value']) => void;
}

export function Dropdown({ id, value, label, options, onChange }: DropdownProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <Select value={String(value)} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
