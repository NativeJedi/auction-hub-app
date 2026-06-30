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

export const useGoogleSignIn = (promptKey?: string | null): SignInState => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const serviceRef = useRef<GoogleAuthService | null>(null);
  const isFirstRun = useRef(true);
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
    serviceRef.current = service;

    void service.init();

    return () => {
      service.stopInit();
      serviceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    serviceRef.current?.reprompt();
  }, [promptKey]);

  return { containerRef, isLoading, error };
};
