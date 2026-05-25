'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useErrorNotification } from '@/src/modules/notifications/NotifcationContext';
import { getGoogleNonce, googleAuth } from '@/src/api/auctions-api-client/requests/auth';
import { loadGisScript } from './gisLoader';

const DASHBOARD_ROUTE = '/crm/auctions';

type SignInState = {
  clientId: string | null;
  ready: boolean;
  signIn: () => void;
};

export const useGoogleSignIn = (): SignInState => {
  const router = useRouter();
  const onError = useErrorNotification();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? null;

  const [ready, setReady] = useState(false);

  const handleCredential = useCallback(
    (credential: string, nonce: string) => {
      googleAuth({ credential, nonce })
        .then(() => router.push(DASHBOARD_ROUTE))
        .catch(onError);
    },
    [router, onError]
  );

  // Prewarm the GIS script so the first click is instant.
  useEffect(() => {
    if (!clientId) return;
    loadGisScript()
      .then(() => setReady(true))
      .catch(onError);
  }, [clientId, onError]);

  const signIn = useCallback(async () => {
    if (!clientId) return;
    try {
      const gis = await loadGisScript();
      const { nonce } = await getGoogleNonce();
      gis.initialize({
        client_id: clientId,
        nonce,
        callback: ({ credential }) => handleCredential(credential, nonce),
      });
      gis.prompt();
    } catch (err) {
      onError(err);
    }
  }, [clientId, onError, handleCredential]);

  return { clientId, ready, signIn };
};
