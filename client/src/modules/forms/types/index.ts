import { z } from 'zod';
import { DefaultValues, FieldValues } from 'react-hook-form';
import { FormField } from './fields';

export type ValidationSchema<T extends FieldValues> = z.ZodType<T, FieldValues>;

type SubmitHandler<T extends FieldValues> = (values: T) => void | Promise<void>;

export interface FormBuilderConfig<T extends FieldValues> {
  schema: ValidationSchema<T>;
  fields: FormField[];
  defaultValues?: DefaultValues<T>;
  onSubmit: SubmitHandler<z.infer<ValidationSchema<T>>>;
}

export * from './fields';
