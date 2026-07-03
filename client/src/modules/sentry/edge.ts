import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from './options';

/** Sentry for the Edge runtime (middleware). */
Sentry.init(sentryOptions);
