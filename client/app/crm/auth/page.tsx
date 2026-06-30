'use client';

import { Suspense } from 'react';
import HeadedLayout from '@/src/layouts/HeadedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui-kit/ui/card';
import { GoogleSignInButton } from '@/src/modules/google-auth';
import { useQueryParam } from '@/src/utils/url';
import LoginForm from '@/app/crm/auth/components/LoginForm';
import RegisterForm from '@/app/crm/auth/components/RegisterForm';
import CheckEmailForm from '@/app/crm/auth/components/CheckEmailForm';

type AuthView = 'login' | 'register' | 'confirm';

type FormView = {
  title: string;
  Component: React.ComponentType;
};

const FORM_VIEW_CONFIG: Record<AuthView, FormView> = {
  login: {
    title: 'Login',
    Component: LoginForm,
  },
  register: {
    title: 'Register',
    Component: RegisterForm,
  },
  confirm: {
    title: 'Check your inbox',
    Component: CheckEmailForm,
  },
};

const getFormView = (param: string | null): FormView => {
  if (!param) return FORM_VIEW_CONFIG.login;

  const formView = FORM_VIEW_CONFIG[param as AuthView];

  if (!formView) return FORM_VIEW_CONFIG.login;

  return formView;
};

// The only part that depends on the `type` search param. Isolating it keeps the
// page shell (layout + Card) static; only this island is deferred to the client.
function AuthForms() {
  const type = useQueryParam('type');

  const FormView = getFormView(type);

  return (
    <>
      <CardHeader>
        <CardTitle className="text-center">{FormView.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {type !== 'confirm' && <GoogleSignInButton promptKey={type} />}
        <FormView.Component />
      </CardContent>
    </>
  );
}

export default function AuthPage() {
  return (
    <HeadedLayout showLogout={false} logoHref="/">
      <div className="flex items-center justify-center bg-base-200 transition-colors flex-1">
        <Card className="w-full max-w-md">
          <Suspense>
            <AuthForms />
          </Suspense>
        </Card>
      </div>
    </HeadedLayout>
  );
}
