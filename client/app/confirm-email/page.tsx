'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import { useQueryParam } from '@/src/utils/url';
import { confirmEmail } from '@/src/api/auctions-api-client/requests/auth';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const token = useQueryParam('token');
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    if (token === null) {
      showToast({ type: 'error', message: 'Confirmation link is invalid.' });
      router.push('/crm/auth');
      setIsPending(false);
      return;
    }

    confirmEmail(token)
      .then(() => {
        showToast({ type: 'success', message: 'Email confirmed! You can now log in.' });
      })
      .catch(() => {
        showToast({
          type: 'error',
          message: 'The confirmation link is invalid or has expired.',
        });
      })
      .finally(() => {
        router.push('/crm/auth');
        setIsPending(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isPending) return null;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Confirming your email…</p>
    </div>
  );
}
