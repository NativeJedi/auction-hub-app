import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from './src/modules/sentry/options';

/**
 * Next.js magic file: loaded automatically in the browser bundle.
 * Catches unhandled errors and promise rejections in the browser —
 * including React render errors and RoomEngine/socket failures.
 * Actual Sentry settings live in src/modules/sentry.
 */
Sentry.init(sentryOptions);

// Lets Sentry attribute errors to App Router navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
