import * as Sentry from '@sentry/nextjs';

/**
 * Auth-flow telemetry. The Google sign-in flow can die silently (blocked
 * webview, GIS script not loading, popup suppressed) — no exception, no
 * signal. Breadcrumbs record each step; when a failure IS reported, the
 * whole trail is attached to the Sentry event, so "started but never got
 * a credential" becomes visible instead of being a mystery.
 *
 * No-ops in dev (Sentry is disabled there).
 */

// In-app browsers (Instagram, Telegram, FB...) break Google OAuth by policy.
// Tagging events lets Sentry group these separately from real bugs.
const isInAppBrowser = (): boolean =>
  typeof navigator !== 'undefined' &&
  /FBAN|FBAV|Instagram|Line|Twitter|WhatsApp|Telegram|; wv\)/i.test(navigator.userAgent);

export const authStep = (step: string, data?: Record<string, unknown>): void => {
  Sentry.addBreadcrumb({
    category: 'google-auth',
    message: step,
    level: 'info',
    data,
  });
};

export const reportAuthFailure = (stage: string, cause: unknown): void => {
  Sentry.captureException(cause instanceof Error ? cause : new Error(String(cause)), {
    tags: {
      flow: 'google-auth',
      stage,
      in_app_browser: String(isInAppBrowser()),
    },
  });
};
