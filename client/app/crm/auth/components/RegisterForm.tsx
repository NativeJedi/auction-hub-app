import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { register } from '@/src/api/auctions-api-client/requests/auth';
import { FormBuilder, FormField } from '@/src/modules/forms';
import ChangeFormViewButton from '@/app/crm/auth/components/ChangeFormViewButton';
import { EmailField, FormValues, PasswordField, validationSchema } from '../utils/fields';

const fields: FormField[] = [EmailField, PasswordField];

function RegisterForm() {
  const router = useRouter();
  const handleError = useErrorNotification();

  const handleSubmit = async (values: FormValues) => {
    register(values)
      .then(() => {
        router.push(`/crm/auth?type=confirm&pending=${encodeURIComponent(values.email)}`);
      })
      .catch((error) => handleError(error, 'Registration failed'));
  };

  return (
    <>
      <FormBuilder<FormValues>
        schema={validationSchema}
        fields={fields}
        onSubmit={handleSubmit}
        submitLabel="Register"
      />
      <ChangeFormViewButton label="Already have an account?" href="/crm/auth">
        Login
      </ChangeFormViewButton>
    </>
  );
}

export default RegisterForm;
