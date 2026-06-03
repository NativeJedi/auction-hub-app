import { ArgumentsHost, BadRequestException, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(BadRequestException, WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(
    exception: BadRequestException | WsException,
    host: ArgumentsHost,
  ): void {
    const client = host.switchToWs().getClient<Socket>();

    if (exception instanceof BadRequestException) {
      const response = exception.getResponse() as
        | string
        | { message: string | string[] };
      const message =
        typeof response === 'string' ? response : response.message;
      client.emit('error', { message });
    } else {
      client.emit('error', { message: exception.message });
    }
  }
}
