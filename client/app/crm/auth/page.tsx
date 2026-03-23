'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import FormChangeViewButton from '@/app/crm/auth/FormChangeViewButton';
import { ApiError } from 'next/dist/server/api-utils';
import { login, register } from '@/src/api/auctions-api-client/requests/auth';
import FormLayout from '@/src/components/form/FormLayout';
import { FormBuilder, FormField } from '@/src/modules/forms';
import { z } from 'zod';

type FormProps = {
  onChangeView: () => void;
  onSubmit: () => void;
  onError: (error: ApiError) => void;
};

type FormValues = {
  email: string;
  password: string;
};

const validationSchema = z.object({
  email: z.string().email('Incorrect email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});

const EmailField: FormField = {
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'you@example.com',
  autoComplete: 'email',
};
const PasswordField: FormField = {
  name: 'password',
  type: 'password',
  label: 'Password',
  placeholder: '••••••••',
  autoComplete: 'new-password',
};

const fields: FormField[] = [EmailField, PasswordField];

const loginFields: FormField[] = [
  EmailField,
  {
    ...PasswordField,
    autoComplete: 'current-password',
  },
];

function LoginForm({ onChangeView, onSubmit, onError }: FormProps) {
  const handleSubmit = (values: FormValues) => {
    return login(values)
      .then(() => {
        onSubmit();
      })
      .catch(onError);
  };

  return (
    <FormLayout
      title="Login"
      footer={
        <FormChangeViewButton label="Don't have an account?" onClick={onChangeView}>
          Register
        </FormChangeViewButton>
      }
    >
      <FormBuilder<FormValues>
        schema={validationSchema}
        fields={loginFields}
        onSubmit={handleSubmit}
        submitLabel="Login"
      />
    </FormLayout>
  );
}

function RegisterForm({ onChangeView, onSubmit, onError }: FormProps) {
  const handleSubmit = async (values: FormValues) => {
    register(values)
      .then(() => {
        onSubmit();
      })
      .catch(onError);
  };

  return (
    <FormLayout
      title="Register"
      footer={
        <FormChangeViewButton label="Already have an account?" onClick={onChangeView}>
          Login
        </FormChangeViewButton>
      }
    >
      <FormBuilder<FormValues>
        schema={validationSchema}
        fields={fields}
        onSubmit={handleSubmit}
        submitLabel="Register"
      />
    </FormLayout>
  );
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const { showToast } = useNotification();

  const handleChangeView = () => setIsLogin(!isLogin);
  const handleSuccessSubmit = () => router.push('/crm/auctions');

  const handleError = (error: ApiError) => {
    showToast({
      type: 'error',
      title: 'Authorization error',
      message: error.message || 'Authorization failed',
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-4 transition-colors">
      {isLogin ? (
        <LoginForm
          onChangeView={handleChangeView}
          onSubmit={handleSuccessSubmit}
          onError={handleError}
        />
      ) : (
        <RegisterForm
          onChangeView={handleChangeView}
          onSubmit={handleSuccessSubmit}
          onError={handleError}
        />
      )}
    </main>
  );
}
