import { FormField } from './types';
import { DefaultValues, FieldValues } from 'react-hook-form';

export function getDefaultValues<T extends FieldValues>(fields: FormField[]): DefaultValues<T> {
  return Object.fromEntries(
    fields.map((field) => {
      switch (field.type) {
        case 'number':
          return [field.name, field.min ?? 0];
        case 'select':
          return [field.name, field.options[0]?.value ?? ''];
        default:
          return [field.name, ''];
      }
    })
  ) as DefaultValues<T>;
}
