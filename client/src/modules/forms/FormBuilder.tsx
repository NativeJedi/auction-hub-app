'use client';

import { FormBuilderConfig } from './types';
import { useFormBuilder } from '@/src/modules/forms/useFormBuilder';
import { Form, FormField } from '@/ui-kit/ui/form';
import { Button } from '@/ui-kit/ui/button';
import { FieldValues, Path } from 'react-hook-form';
import { FieldProps } from '@/src/modules/forms/fields/types';
import { getFormFieldComponent } from '@/src/modules/forms/fields';

type Props<T extends FieldValues> = FormBuilderConfig<T> & {
  hideSubmit?: boolean;
  submitLabel?: string;
  formRef?: React.RefObject<HTMLFormElement | null>;
};

const FieldRenderer = ({ field, ...rhfFieldProps }: FieldProps) => {
  const FieldComponent = getFormFieldComponent(field.type);

  return <FieldComponent field={field} {...rhfFieldProps} />;
};

function FormBuilder<T extends FieldValues>({
  hideSubmit = false,
  submitLabel = 'Submit',
  formRef,
  ...config
}: Props<T>) {
  const { form, isSubmitting, handleSubmit } = useFormBuilder(config);

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="space-y-4">
          {config.fields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name as Path<T>}
              render={({ field: rhfField }) => (
                <FieldRenderer
                  field={field}
                  disabled={field.disabled || isSubmitting}
                  {...rhfField}
                />
              )}
            />
          ))}
        </div>

        {!hideSubmit && (
          <Button type="submit" loading={isSubmitting} className="mt-6 w-full">
            {submitLabel}
          </Button>
        )}
      </form>
    </Form>
  );
}

export default FormBuilder;
