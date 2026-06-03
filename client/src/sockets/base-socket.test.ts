import { beforeEach, describe, expect, it, vi } from 'vitest';

const { handlers, mockSocket } = vi.hoisted(() => {
  const handlers: Record<string, (...args: any[]) => void> = {};
  const mockSocket = {
    connected: false,
    once: vi.fn((event: string, cb: (...args: any[]) => void) => {
      handlers[`once:${event}`] = cb;
    }),
    on: vi.fn((event: string, cb: (...args: any[]) => void) => {
      handlers[`on:${event}`] = cb;
    }),
    disconnect: vi.fn(),
    io: { on: vi.fn() },
  };
  return { handlers, mockSocket };
});

vi.mock('socket.io-client', () => ({ io: vi.fn(() => mockSocket) }));

import BaseSocket from './base-socket';

async function connectSocket(bs: BaseSocket): Promise<void> {
  const p = bs.connect('token');
  mockSocket.connected = true;
  handlers['once:connect']?.();
  await p;
}

beforeEach(() => {
  for (const k of Object.keys(handlers)) delete handlers[k];
  mockSocket.connected = false;
  vi.clearAllMocks();
});

describe('BaseSocket', () => {
  describe('isConnected', () => {
    it('returns false before connect is called', () => {
      const bs = new BaseSocket('ws://test');

      expect(bs.isConnected).toBe(false);
    });

    it('returns true when the underlying socket reports connected', async () => {
      const bs = new BaseSocket('ws://test');

      await connectSocket(bs);

      expect(bs.isConnected).toBe(true);
    });

    it('returns false after disconnect without nulling the socket instance', async () => {
      const bs = new BaseSocket('ws://test');
      await connectSocket(bs);

      mockSocket.connected = false;
      handlers['on:disconnect']?.();

      // Socket instance is still alive — isConnected reflects socket.connected, not a null check
      expect(bs.isConnected).toBe(false);

      // Auto-reconnect can flip connected back to true without re-creating the socket
      mockSocket.connected = true;
      expect(bs.isConnected).toBe(true);
    });
  });

  describe('onReconnect', () => {
    it('wires the callback to the socket.io Manager reconnect event', async () => {
      const bs = new BaseSocket('ws://test');
      await connectSocket(bs);

      const cb = vi.fn();
      bs.onReconnect(cb);

      expect(mockSocket.io.on).toHaveBeenCalledWith('reconnect', cb);
    });
  });
});
