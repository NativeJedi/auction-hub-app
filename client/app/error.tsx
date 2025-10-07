'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { isTokenExpiredError } from '@/src/utils/errors';
import { refreshToken } from '@/src/api/requests/browser/auth';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

const RefreshTokenComponent = () => {
  useEffect(() => {
    if (window.refreshingPromise) return;

    window.refreshingPromise = refreshToken()
      .then(() => {
        window.location.reload();
      })
      .catch(() => {
        window.location.href = '/crm/auth';
      })
      .finally(() => {
        delete window.refreshingPromise;
      });
  }, []);

  return null;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  if (isTokenExpiredError(error)) {
    return <RefreshTokenComponent />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-100 text-base-content px-4">
      <div className="bg-white dark:bg-base-200 shadow-lg rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-5xl font-bold text-error mb-4">😵 Oops!</h1>
        <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-base-content/70 mb-6">{error.message || 'Unknown error occurred.'}</p>

        <div className="flex justify-center gap-4">
          <button className="btn btn-primary" onClick={() => reset()}>
            Retry
          </button>
          <Link href="/crm/auth" className="btn btn-outline">
            Go login
          </Link>
        </div>
      </div>
    </div>
  );
}
