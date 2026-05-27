'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';
import { useQueryParam } from '@/src/utils/url';
import { confirmEmail } from '@/src/api/auctions-api-client/requests/auth';
import { Loader2 } from 'lucide-react';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const token = useQueryParam('token');

  useEffect(() => {
    if (token === null) {
      showToast({ type: 'error', message: 'Confirmation link is invalid.' });
      router.push('/crm/auth');
      return;
    }

    confirmEmail(token)
      .then(() => router.push('/crm/auctions'))
      .catch(() => {
        showToast({
          type: 'error',
          message: 'The confirmation link is invalid or has expired.',
        });
        router.push('/crm/auth');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
