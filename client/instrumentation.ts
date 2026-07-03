import * as Sentry from '@sentry/nextjs';

/**
 * Next.js magic file: register() runs once when the server starts.
 * Actual Sentry settings live in src/modules/sentry.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./src/modules/sentry/server');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./src/modules/sentry/edge');
  }
}

// Captures errors from nested RSC / route handler failures
export const onRequestError = Sentry.captureRequestError;
