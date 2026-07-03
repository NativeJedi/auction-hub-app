import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import { AppConfig } from './app.config';

const isDev = AppConfig.ENV === 'development';

/**
 * nestjs-pino configuration.
 *
 * - dev:  human-readable colored output via pino-pretty
 * - prod: raw JSON lines to stdout (picked up by Docker -> CloudWatch)
 *
 * Every HTTP request is logged automatically (method, url, status, duration)
 * and gets a requestId; any log written by services during that request
 * carries the same requestId, so all lines of one request can be correlated.
 */
export const LoggerConfig: Params = {
  pinoHttp: {
    level: AppConfig.LOG_LEVEL,

    // Reuse the id set by an upstream proxy (BFF forwards x-request-id),
    // otherwise generate one. Echo it back so the client can report it.
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const existing = req.headers['x-request-id'];
      const id = typeof existing === 'string' ? existing : randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },

    // Never let secrets end up in logs, even by accident.
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
      ],
      censor: '[REDACTED]',
    },

    // Default serializers dump the whole req/res objects — too noisy.
    // Keep only what is useful for debugging.
    serializers: {
      req: (req: { id: string; method: string; url: string }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res: { statusCode: number }) => ({
        statusCode: res.statusCode,
      }),
    },

    // 4xx/5xx responses are logged by the exception filter with full context;
    // the auto request log just reflects the status level.
    customLogLevel: (req: IncomingMessage, res: ServerResponse, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },

    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            translateTime: 'HH:MM:ss',
            // requestId is still there, just not repeated in every line
            ignore: 'pid,hostname,req.id',
          },
        }
      : undefined,
  },
};
