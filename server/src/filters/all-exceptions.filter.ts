import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Request, Response } from 'express';

/**
 * Global catch-all for HTTP requests. Every exception that no one handled
 * ends up here, so services/controllers just `throw` — no try/catch needed
 * for logging.
 *
 * - HttpException (4xx, thrown intentionally): logged as `warn` without a
 *   stack — expected business rejections, the response body is preserved
 *   as-is (e.g. ApiAuthorizationError's { message, reason } shape).
 * - Everything else (bugs, Redis/DB failures): logged as `error` WITH the
 *   stack trace, and the client gets a generic 500 so internals never leak.
 *
 * Logs written here run inside the request context, so pino automatically
 * attaches the same requestId as the auto request log.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestContext = {
      method: request.method,
      url: request.originalUrl ?? request.url,
      statusCode: status,
    };

    if (isHttpException && status < 500) {
      const body = exception.getResponse();
      this.logger.warn({
        msg: 'Request rejected',
        ...requestContext,
        error: body,
      });
      response
        .status(status)
        .json(
          typeof body === 'string'
            ? { statusCode: status, message: body }
            : body,
        );
      return;
    }

    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error({
      msg: 'Unhandled exception',
      ...requestContext,
      err: { type: error.name, message: error.message, stack: error.stack },
    });

    // Only unexpected errors go to Sentry — intentional 4xx above are not
    // bugs and would drown the real signal. No-op when Sentry is disabled.
    Sentry.captureException(error, { extra: requestContext });

    response.status(status).json({
      statusCode: status,
      message: 'Internal server error',
    });
  }
}
