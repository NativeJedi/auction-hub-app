import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from './options';

/**
 * Sentry for the Next.js Node runtime: RSC rendering, route handlers
 * (the BFF proxy in app/api), server actions.
 */
Sentry.init(sentryOptions);
