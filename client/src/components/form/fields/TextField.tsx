import type { HTMLInputTypeAttribute } from 'react';
import { Input } from '@/ui-kit/ui/input';
import { Field, FieldLabel } from '@/ui-kit/ui/field';

type TextFieldProps = {
  value?: string;
  label: string;
  placeholder?: string;
  id: string;
  type?: HTMLInputTypeAttribute;
  onChange: (value: string) => void;
};

const TextField = ({ label, placeholder, id, type = 'text', value, onChange }: TextFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} type={type} placeholder={placeholder} value={value} onChange={handleChange} />
      {/* TODO: add validation */}
      {/*<FieldDescription>Choose a unique username for your account.</FieldDescription>*/}
    </Field>
  );
};

export default TextField;
