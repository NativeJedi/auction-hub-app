import { FormFieldComponent } from '@/src/modules/forms/fields/types';
import { FormField } from '@/src/modules/forms';
import TextField from './Text';
import SelectField from './Select';
import NumberField from './Number';

const FormFieldRegistry: Record<FormField['type'], FormFieldComponent> = {
  text: TextField,
  email: TextField,
  password: TextField,
  select: SelectField,
  number: NumberField,
};

const getFormFieldComponent = (type: FormField['type']) => FormFieldRegistry[type];

export { getFormFieldComponent };
