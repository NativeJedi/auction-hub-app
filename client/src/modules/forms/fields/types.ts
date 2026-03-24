import { FormField } from '@/src/modules/forms';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';

type RHFFieldProps = ControllerRenderProps<FieldValues, string>;

export type FieldProps = RHFFieldProps & {
  field: FormField;
  disabled: boolean;
};

export type FormFieldComponent = React.FC<FieldProps>;
