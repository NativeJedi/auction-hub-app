import { FormFieldComponent } from '@/src/modules/forms/fields/types';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/ui-kit/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-kit/ui/select';

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

export default SelectField;
