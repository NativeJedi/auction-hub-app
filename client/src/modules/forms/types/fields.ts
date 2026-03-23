export type FieldType = 'text' | 'email' | 'password' | 'select' | 'number';

interface BaseField {
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  autoComplete?: string;
}

interface TextField extends BaseField {
  type: 'text' | 'email' | 'password';
}

interface SelectField extends BaseField {
  type: 'select';
  options: { label: string; value: string | number }[];
}

interface NumberField extends BaseField {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
}

export type FormField = TextField | SelectField | NumberField;
