'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import FormChangeViewButton from '@/app/crm/auth/FormChangeViewButton';
import { ApiError } from 'next/dist/server/api-utils';
import { login, register, resendConfirmation } from '@/src/api/auctions-api-client/requests/auth';
import { FormBuilder, FormField } from '@/src/modules/forms';
import { z } from 'zod';
import FormLayout from '@/src/layouts/FormLayout';
import HeadedLayout from '@/src/layouts/HeadedLayout';
import { GoogleSignInButton } from '@/src/modules/google-auth';
import { Button } from '@/ui-kit/ui/button';
import { useQueryParam } from '@/src/utils/url';
import { hasErrorData } from '@/src/utils/checkers';

type FormProps = {
  onChangeView: () => void;
  onSubmit: (email?: string) => void;
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

const isEmailNotVerifiedError = (error: unknown) =>
  hasErrorData(error, 'message', 'EMAIL_NOT_VERIFIED');

const is429Error = (error: unknown) =>
  hasErrorData(error, 'statusCode', 429);

function CheckEmailView({ email, onResend }: { email: string; onResend: () => void }) {
  return (
    <FormLayout title="Check your inbox">
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click
          it to activate your account. The link expires in 24 hours.
        </p>
        <Button variant="outline" className="w-full" onClick={onResend}>
          Resend
        </Button>
      </div>
    </FormLayout>
  );
}

function LoginForm({ onChangeView, onSubmit, onError }: FormProps) {
  const [emailNotVerified, setEmailNotVerified] = useState<string | null>(null);
  const { showToast } = useNotification();

  const handleSubmit = (values: FormValues) => {
    return login(values)
      .then(() => {
        setEmailNotVerified(null);
        onSubmit();
      })
      .catch((error: unknown) => {
        if (isEmailNotVerifiedError(error)) {
          setEmailNotVerified(values.email);
        } else {
          setEmailNotVerified(null);
          onError(error as ApiError);
        }
      });
  };

  const handleResend = () => {
    if (!emailNotVerified) return;
    resendConfirmation(emailNotVerified)
      .then(() => showToast({ type: 'success', message: 'New confirmation link sent.' }))
      .catch((error: unknown) => {
        showToast({
          type: 'error',
          message: is429Error(error)
            ? 'Too many requests — please wait before trying again.'
            : 'Failed to resend the confirmation email.',
        });
      });
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
      <GoogleSignInButton />
      {emailNotVerified && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Your email address hasn&apos;t been confirmed yet. Check your inbox or{' '}
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-destructive underline"
            onClick={handleResend}
          >
            Resend confirmation email
          </Button>
          .
        </div>
      )}
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
        onSubmit(values.email);
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
      <GoogleSignInButton />
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
  const pendingParam = useQueryParam('pending');
  const pendingEmail = pendingParam ? decodeURIComponent(pendingParam) : null;

  const handleChangeView = () => setIsLogin(!isLogin);

  const handleSuccessSubmit = (email?: string) => {
    if (email) {
      router.push(`/crm/auth?pending=${encodeURIComponent(email)}`);
    } else {
      router.push('/crm/auctions');
    }
  };

  const handleError = (error: ApiError) => {
    showToast({
      type: 'error',
      title: 'Authorization error',
      message: error.message || 'Authorization failed',
    });
  };

  const handlePendingResend = () => {
    if (!pendingEmail) return;
    resendConfirmation(pendingEmail)
      .then(() => showToast({ type: 'success', message: 'New confirmation link sent.' }))
      .catch((error: unknown) => {
        showToast({
          type: 'error',
          message: is429Error(error)
            ? 'Too many requests — please wait before trying again.'
            : 'Failed to resend the confirmation email.',
        });
      });
  };

  return (
    <HeadedLayout showLogout={false}>
      <div className="flex items-center justify-center bg-base-200 transition-colors flex-1">
        {pendingEmail ? (
          <CheckEmailView email={pendingEmail} onResend={handlePendingResend} />
        ) : isLogin ? (
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
      </div>
    </HeadedLayout>
  );
}
