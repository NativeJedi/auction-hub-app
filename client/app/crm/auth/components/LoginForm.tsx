import { FormBuilder, FormField } from '@/src/modules/forms';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { useRouter } from 'next/navigation';
import { login } from '@/src/api/auctions-api-client/requests/auth';
import { EmailField, FormValues, PasswordField, validationSchema } from '../utils/fields';
import ChangeFormViewButton from '@/app/crm/auth/components/ChangeFormViewButton';
import { isEmailNotVerifiedError } from '@/app/crm/auth/utils/errors';

const loginFields: FormField[] = [
  EmailField,
  {
    ...PasswordField,
    autoComplete: 'current-password',
  },
];

function LoginForm() {
  const handleError = useErrorNotification();
  const router = useRouter();

  const handleSubmit = (values: FormValues) => {
    return login(values)
      .then(() => {
        router.push('/crm/auctions');
      })
      .catch((error: unknown) => {
        if (isEmailNotVerifiedError(error)) {
          router.push(`/crm/auth?type=confirm&pending=${encodeURIComponent(values.email)}`);
        } else {
          handleError(error, 'Authorization failed');
        }
      });
  };

  return (
    <>
      <FormBuilder<FormValues>
        schema={validationSchema}
        fields={loginFields}
        onSubmit={handleSubmit}
        submitLabel="Login"
      />
      <ChangeFormViewButton label="Don't have an account?" href="/crm/auth?type=register">
        Register
      </ChangeFormViewButton>
    </>
  );
}

export default LoginForm;
