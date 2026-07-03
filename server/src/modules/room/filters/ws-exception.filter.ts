import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomAuthorizedUser } from '../entities/room.entity';

/**
 * Catch-all for gateway events (was: only BadRequestException | WsException,
 * and nothing was logged — unexpected errors vanished silently).
 *
 * - HttpException / WsException (thrown intentionally by RoomService):
 *   logged as `warn`, original message forwarded to the client.
 * - Anything else (bugs, Redis failures): logged as `error` with stack,
 *   client gets a generic message so internals never leak.
 *
 * Every log carries { roomId, userId } from the socket handshake, so the
 * whole history of a room can be pulled with one query.
 */
@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    // socket.io types `data` as any — cast so eslint/tsc keep us honest
    const user = (client.data as { user?: RoomAuthorizedUser }).user;

    const context = {
      roomId: user?.auctionId,
      userId: user?.id,
    };

    if (exception instanceof HttpException) {
      const response = exception.getResponse() as
        | string
        | { message: string | string[] };
      const message =
        typeof response === 'string' ? response : response.message;

      this.logger.warn({
        msg: 'WS event rejected',
        ...context,
        error: message,
      });
      client.emit('error', { message });
      return;
    }

    if (exception instanceof WsException) {
      this.logger.warn({
        msg: 'WS event rejected',
        ...context,
        error: exception.message,
      });
      client.emit('error', { message: exception.message });
      return;
    }

    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error({
      msg: 'Unhandled WS exception',
      ...context,
      err: { type: error.name, message: error.message, stack: error.stack },
    });

    // Unexpected errors only, same rule as the HTTP filter
    Sentry.captureException(error, { extra: context });

    client.emit('error', { message: 'Internal server error' });
  }
}
