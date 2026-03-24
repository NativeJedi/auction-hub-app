import { FormFieldComponent } from '@/src/modules/forms/fields/types';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/ui-kit/ui/form';
import { Input } from '@/ui-kit/ui/input';

const TextField: FormFieldComponent = ({ field, disabled, ...rhfFieldProps }) => {
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

export default TextField;
