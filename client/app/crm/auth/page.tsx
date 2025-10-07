'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import FormLayout from '@/app/crm/auth/FormLayout';
import FormChangeViewButton from '@/app/crm/auth/FormChangeViewButton';
import TextField from '@/src/ui/components/TextField';
import { login, register } from '@/src/api/requests/browser/auth';
import { ApiError } from 'next/dist/server/api-utils';

type FormProps = {
  onChangeView: () => void;
  onSubmit: () => void;
  onError: (error: ApiError) => void;
};

function LoginForm({ onChangeView, onSubmit, onError }: FormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    login({ email, password })
      .then(({ user }) => {
        localStorage.setItem('user', JSON.stringify(user));
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
      submitLabel="Login"
      onSubmit={handleSubmit as any}
    >
      <TextField
        value={email}
        onChange={setEmail}
        label="Email"
        placeholder="you@example.com"
        id="email"
        type="email"
      />
      <TextField
        value={password}
        onChange={setPassword}
        label="Password"
        placeholder="••••••••"
        id="password"
        type="password"
      />
    </FormLayout>
  );
}

type RegisterFormFields = { email: string; password: string };

function RegisterForm({ onChangeView, onSubmit, onError }: FormProps) {
  const [{ email, password }, setFields] = useState<RegisterFormFields>({
    email: '',
    password: '',
  });

  const handleChangeField = (field: keyof RegisterFormFields) => (value: string) =>
    setFields((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    register({ email, password })
      .then(({ user }) => {
        localStorage.setItem('user', JSON.stringify(user));
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
      submitLabel="Register"
      onSubmit={handleSubmit as any}
    >
      <TextField
        value={email}
        onChange={handleChangeField('email')}
        label="Email"
        placeholder="you@example.com"
        id="email"
        type="email"
      />
      <TextField
        value={password}
        onChange={handleChangeField('password')}
        label="Password"
        placeholder="••••••••"
        id="password"
        type="password"
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
