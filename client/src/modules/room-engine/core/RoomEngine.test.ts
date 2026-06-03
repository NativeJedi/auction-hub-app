import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';
import type BaseSocket from '@/src/sockets/base-socket';

// ── Minimal concrete subclass ──────────────────────────────────────────────

interface TestData {
  value: number;
}

class TestEngine extends RoomEngine<TestData> {
  readonly fetchMock = vi.fn().mockResolvedValue({ value: 42 } satisfies Partial<TestData>);

  // Expose the protected constructor so tests can instantiate directly
  constructor(auctionId: string, socket: BaseSocket) {
    super(auctionId, socket);
  }

  protected getInitialData(): TestData {
    return { value: 0 };
  }

  protected fetchInitialData(): Promise<Partial<TestData>> {
    return this.fetchMock() as Promise<Partial<TestData>>;
  }
}

// ── Socket stub factory ────────────────────────────────────────────────────

function makeSocket(connected = false) {
  let _connected = connected;
  let reconnectCb: (() => void) | undefined;

  return {
    get isConnected() {
      return _connected;
    },
    setConnected: (v: boolean) => {
      _connected = v;
    },
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    onError: vi.fn(),
    onEvent: vi.fn(),
    emitEvent: vi.fn(),
    offEvent: vi.fn(),
    onReconnect: vi.fn((cb: () => void) => {
      reconnectCb = cb;
    }),
    fireReconnect: () => {
      reconnectCb?.();
    },
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('RoomEngine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
  });

  describe('clearAllRoomTokens', () => {
    it('removes only keys that start with "room:" and leaves other localStorage keys intact', () => {
      localStorage.setItem('room:auction-1:token', 'tok-a');
      localStorage.setItem('room:auction-2:token', 'tok-b');
      localStorage.setItem('user-preference', 'dark');
      localStorage.setItem('authToken', 'jwt-xyz');

      RoomEngine.clearAllRoomTokens();

      expect(localStorage.getItem('room:auction-1:token')).toBeNull();
      expect(localStorage.getItem('room:auction-2:token')).toBeNull();
      expect(localStorage.getItem('user-preference')).toBe('dark');
      expect(localStorage.getItem('authToken')).toBe('jwt-xyz');
    });
  });

  describe('reconnect', () => {
    it('calls fetchInitialData and updates state when socket.io reconnects', async () => {
      const socket = makeSocket(true);
      const engine = new TestEngine('auction-1', socket as unknown as BaseSocket);
      await engine.connect();

      engine.fetchMock.mockResolvedValue({ value: 99 });
      socket.fireReconnect();

      // fetchMock is called synchronously at the start of handleReconnect (before first await)
      expect(engine.fetchMock).toHaveBeenCalledTimes(2); // initial connect + reconnect

      await vi.waitFor(() => expect(engine.getState().value).toBe(99));
      expect(engine.getState().isLoading).toBe(false);
    });
  });

  describe('visibilitychange', () => {
    it('refetches when the tab becomes visible and the socket is disconnected', async () => {
      const socket = makeSocket(false);
      const engine = new TestEngine('auction-1', socket as unknown as BaseSocket);
      await engine.connect();
      engine.fetchMock.mockClear();

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // handleReconnect is triggered synchronously — fetchMock is called before its first await
      expect(engine.fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not refetch when the tab becomes visible but the socket is still connected', async () => {
      const socket = makeSocket(true);
      const engine = new TestEngine('auction-1', socket as unknown as BaseSocket);
      await engine.connect();
      engine.fetchMock.mockClear();

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(engine.fetchMock).not.toHaveBeenCalled();
    });

    it('does not refetch after destroy removes the listener', async () => {
      const socket = makeSocket(false);
      const engine = new TestEngine('auction-1', socket as unknown as BaseSocket);
      await engine.connect();
      engine.destroy();
      engine.fetchMock.mockClear();

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(engine.fetchMock).not.toHaveBeenCalled();
    });
  });
});
