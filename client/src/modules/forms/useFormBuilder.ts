import { FieldValues, Path, useForm } from 'react-hook-form';
import { FormBuilderConfig } from '@/src/modules/forms/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { isFormFieldError } from '@/src/modules/forms/errors';
import { getDefaultValues } from '@/src/modules/forms/utils';

export const useFormBuilder = <T extends FieldValues>(config: FormBuilderConfig<T>) => {
  const form = useForm<T>({
    resolver: zodResolver(config.schema) as any,
    defaultValues: config.defaultValues || getDefaultValues<T>(config.fields),
    mode: 'onSubmit',
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await config.onSubmit(values);
    } catch (error) {
      if (isFormFieldError(error)) {
        form.setError(error.field as Path<T>, {
          type: 'server',
          message: error.message,
        });
        return;
      }

      throw error;
    }
  });

  return {
    form,
    isSubmitting: form.formState.isSubmitting,
    handleSubmit,
  };
};
