'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Last-resort fallback: renders only when the root layout itself crashes
 * (app/error.tsx handles everything below it). Must render its own
 * <html>/<body> because the layout is gone. Kept dependency-free —
 * ui-kit components may be the thing that just crashed.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please try again.</p>
          <button onClick={reset} style={{ padding: '8px 16px' }}>
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
