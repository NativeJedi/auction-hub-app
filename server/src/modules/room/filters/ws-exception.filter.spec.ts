import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WsExceptionFilter } from './ws-exception.filter';

const buildHost = (clientData: Record<string, unknown> = {}) => {
  const emit = jest.fn();
  const client = { emit, data: clientData };
  const host = {
    switchToWs: () => ({ getClient: () => client }),
  } as unknown as ArgumentsHost;
  return { host, emit };
};

describe('WsExceptionFilter', () => {
  let filter: WsExceptionFilter;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new WsExceptionFilter();
    // Silence expected warn/error output in test runs
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('forwards HttpException messages to the client', () => {
    const { host, emit } = buildHost();

    filter.catch(new BadRequestException('bid too low'), host);

    expect(emit).toHaveBeenCalledWith('error', { message: 'bid too low' });
  });

  it('forwards WsException messages to the client', () => {
    const { host, emit } = buildHost();

    filter.catch(new WsException('not allowed'), host);

    expect(emit).toHaveBeenCalledWith('error', { message: 'not allowed' });
  });

  it('hides internals for unexpected errors and logs them with room context', () => {
    const { host, emit } = buildHost({
      user: { id: 'user-1', auctionId: 'auction-1' },
    });

    filter.catch(new Error('ECONNREFUSED redis:6379'), host);

    expect(emit).toHaveBeenCalledWith('error', {
      message: 'Internal server error',
    });
    const expectedErr = expect.objectContaining({
      message: 'ECONNREFUSED redis:6379',
    }) as unknown as object;
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: 'auction-1',
        userId: 'user-1',
        err: expectedErr,
      }),
    );
  });
});
