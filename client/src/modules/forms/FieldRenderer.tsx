import { FormControl, FormItem, FormLabel, FormMessage } from '@/ui-kit/ui/form';
import { Input } from '@/ui-kit/ui/input';
import { FormField } from './types/fields';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-kit/ui/select';
import { ChangeEvent, useEffect, useState } from 'react';

type RHFFieldProps = ControllerRenderProps<FieldValues, string>;

type FieldProps = RHFFieldProps & {
  field: FormField;
  disabled: boolean;
};

type FormFieldComponent = React.FC<FieldProps>;

const NumberField: FormFieldComponent = ({ field, disabled, onChange, value }) => {
  if (field.type !== 'number') return null;

  const min = field.min || 0;
  const max = field.max || Number.MAX_SAFE_INTEGER;

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
    <FormItem>
      <FormLabel>{field.label}</FormLabel>
      <FormControl>
        <Input
          type="number"
          placeholder={field.placeholder}
          disabled={disabled}
          min={field.min}
          max={field.max}
          step={field.step}
          value={internalValue}
          onChange={handleChange}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const SelectField: FormFieldComponent = ({ field, disabled, onChange, value }) => {
  if (field.type !== 'select') return null;

  return (
    <FormItem>
      <FormLabel>{field.label}</FormLabel>
      <FormControl>
        <Select value={String(value)} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const InputField: FormFieldComponent = ({ field, disabled, ...rhfFieldProps }) => {
  return (
    <FormItem>
      <FormLabel>{field.label}</FormLabel>
      <FormControl>
        <Input
          type={field.type}
          placeholder={field.placeholder}
          disabled={disabled}
          autoComplete={field.autoComplete}
          {...rhfFieldProps}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const FormFieldMap: Record<FormField['type'], FormFieldComponent> = {
  text: InputField,
  email: InputField,
  password: InputField,
  select: SelectField,
  number: NumberField,
};

const FieldRenderer = (props: FieldProps) => {
  const FieldComponent = FormFieldMap[props.field.type];

  return <FieldComponent {...props} />;
};

export default FieldRenderer;
