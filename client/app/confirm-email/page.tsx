'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import { useQueryParam } from '@/src/utils/url';
import { clientFetch } from '@/src/api/clientFetch';
import { Loader2 } from 'lucide-react';

const confirmEmail = (code: string) => clientFetch('/auth/confirm-email', { params: { code } });

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ConfirmEmailContent() {
  const router = useRouter();
  const { showToast } = useNotification();
  const code = useQueryParam('code');

  useEffect(() => {
    if (code === null) {
      showToast({ type: 'error', message: 'Confirmation link is invalid.' });
      router.push('/crm/auth');
      return;
    }

    confirmEmail(code)
      .then(() => router.push('/crm/auctions'))
      .catch(() => {
        showToast({
          type: 'error',
          message: 'The confirmation link is invalid or has expired.',
        });
        router.push('/crm/auth');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <Spinner />;
}

export default function ConfirmEmailPage() {
  // useQueryParam relies on useSearchParams, which must sit inside a Suspense
  // boundary so static prerendering (next build) doesn't bail on this page.
  return (
    <Suspense fallback={<Spinner />}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
