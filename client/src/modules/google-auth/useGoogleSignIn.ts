'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthService } from './googleAuthService';

const DASHBOARD_ROUTE = '/crm/auctions';

type SignInState = {
  containerRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  error: unknown;
};

export const useGoogleSignIn = (): SignInState => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const service = new GoogleAuthService(container, {
      onReady: () => {},
      onLoading: () => setIsLoading(true),
      onSuccess: () => router.push(DASHBOARD_ROUTE),
      onFatalError: (cause) => {
        setIsLoading(false);
        setError(cause);
      },
    });

    void service.init();

    return () => service.stopInit();
  }, []);

  return { containerRef, isLoading, error };
};
