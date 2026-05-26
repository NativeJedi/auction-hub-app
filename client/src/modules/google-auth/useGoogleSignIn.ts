'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthService } from './googleAuthService';

const DASHBOARD_ROUTE = '/crm/auctions';

type SignInState = {
  containerRef: RefObject<HTMLDivElement | null>;
  error: unknown;
};

export const useGoogleSignIn = (): SignInState => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const service = new GoogleAuthService(container, {
      onReady: () => {},
      onSuccess: () => router.push(DASHBOARD_ROUTE),
      onFatalError: setError,
    });

    void service.init();

    return () => service.stopInit();
  }, []);

  return { containerRef, error };
};
