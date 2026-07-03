/**
 * Single source of truth for Sentry settings on the client workspace.
 * Used by all three runtimes (browser, Node server, edge) — the magic
 * entrypoint files in the project root are thin wrappers around this module.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // No-op in dev/test and when the DSN is not provided at build time
  enabled: process.env.NODE_ENV === 'production' && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  environment: process.env.NODE_ENV,

  // Errors only; performance tracing has its own quota and can be enabled later
  tracesSampleRate: 0,
};
