import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { makeSARequest } from '@/src/api/makeSARequest';
import { registerAction } from '@/src/api/actions/auth.actions';
import { FormBuilder, FormField } from '@/src/modules/forms';
import ChangeFormViewButton from '@/app/crm/auth/components/ChangeFormViewButton';
import { EmailField, FormValues, PasswordField, validationSchema } from '../utils/fields';

const register = makeSARequest(registerAction);

const fields: FormField[] = [EmailField, PasswordField];

function RegisterForm() {
  const router = useRouter();
  const handleError = useErrorNotification();

  const handleSubmit = async (values: FormValues) => {
    try {
      await register(values);

      router.push(`/crm/auth?type=confirm&pending=${encodeURIComponent(values.email)}`);
    } catch (error: unknown) {
      handleError(error, 'Registration failed');
    }
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
