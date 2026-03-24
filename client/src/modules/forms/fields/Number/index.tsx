import { FormControl, FormItem, FormLabel, FormMessage } from '@/ui-kit/ui/form';
import { FormFieldComponent } from '@/src/modules/forms/fields/types';
import NumberInput from '@/src/modules/forms/fields/Number/NumberInput';

const NumberField: FormFieldComponent = ({ field, disabled, onChange, value }) => {
  if (field.type !== 'number') return null;

  return (
    <FormItem>
      <FormLabel>{field.label}</FormLabel>
      <FormControl>
        <NumberInput
          value={value}
          onChange={onChange}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default NumberField;
