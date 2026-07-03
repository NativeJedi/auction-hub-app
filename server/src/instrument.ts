import * as Sentry from '@sentry/nestjs';
import { AppConfig } from './config/app.config';

/**
 * Sentry must be initialized before anything else is imported (its
 * instrumentation patches Node internals), which is why main.ts imports
 * this file on its very first line.
 *
 * No-op unless SENTRY_DSN is set AND we run in production — dev and test
 * errors stay local.
 */
Sentry.init({
  dsn: AppConfig.SENTRY_DSN,
  enabled: AppConfig.ENV === 'production' && Boolean(AppConfig.SENTRY_DSN),
  environment: AppConfig.ENV,

  // Errors only for now. Raise (e.g. 0.1) to sample performance traces —
  // that's a separate Sentry feature with its own quota.
  tracesSampleRate: 0,
});
