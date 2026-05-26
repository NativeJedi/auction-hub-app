// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id';
});

const { mockLoadGisScript, mockGetGoogleNonce, mockGoogleAuth, fakeGis } = vi.hoisted(() => ({
  mockLoadGisScript: vi.fn(),
  mockGetGoogleNonce: vi.fn(),
  mockGoogleAuth: vi.fn(),
  fakeGis: {
    initialize: vi.fn(),
    prompt: vi.fn(),
    renderButton: vi.fn(),
    cancel: vi.fn(),
  },
}));

vi.mock('./gisLoader', () => ({
  loadGisScript: mockLoadGisScript,
}));

vi.mock('@/src/api/auctions-api-client/requests/auth', () => ({
  getGoogleNonce: mockGetGoogleNonce,
  googleAuth: mockGoogleAuth,
}));

import { GoogleAuthService } from './googleAuthService';
import type { GoogleAuthCallbacks, GoogleIdInitializeConfig } from './types';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const makeCallbacks = (over: Partial<GoogleAuthCallbacks> = {}): GoogleAuthCallbacks => ({
  onReady: vi.fn(),
  onSuccess: vi.fn(),
  onFatalError: vi.fn(),
  ...over,
});

const nonceErrorWith = (reason: string, status = 401) => {
  const err = new Error('Authorization error') as Error & { data?: unknown };
  err.data = { message: 'Authorization error', reason, status };
  return err;
};

describe('GoogleAuthService', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.resetAllMocks();
    mockLoadGisScript.mockResolvedValue(fakeGis);
    mockGetGoogleNonce.mockResolvedValue({ nonce: 'n-1' });
    mockGoogleAuth.mockResolvedValue(undefined);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('init loads GIS, fetches a nonce, initializes, renders the button, and prompts in order', async () => {
    const service = new GoogleAuthService(container, makeCallbacks());

    await service.init();

    expect(mockLoadGisScript).toHaveBeenCalledTimes(1);
    expect(mockGetGoogleNonce).toHaveBeenCalledTimes(1);
    expect(fakeGis.initialize).toHaveBeenCalledTimes(1);
    expect(fakeGis.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'test-client-id',
        nonce: 'n-1',
        callback: expect.any(Function),
      }),
    );
    expect(fakeGis.renderButton).toHaveBeenCalledWith(container, expect.any(Object));
    expect(fakeGis.prompt).toHaveBeenCalledTimes(1);

    const initOrder = fakeGis.initialize.mock.invocationCallOrder[0];
    const renderOrder = fakeGis.renderButton.mock.invocationCallOrder[0];
    const promptOrder = fakeGis.prompt.mock.invocationCallOrder[0];
    expect(initOrder).toBeLessThan(renderOrder);
    expect(renderOrder).toBeLessThan(promptOrder);
  });

  it('calls onReady after prompt() on a successful init', async () => {
    const callbacks = makeCallbacks();
    const service = new GoogleAuthService(container, callbacks);

    await service.init();

    expect(callbacks.onReady).toHaveBeenCalledTimes(1);
    const promptOrder = fakeGis.prompt.mock.invocationCallOrder[0];
    const readyOrder = (callbacks.onReady as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
    expect(promptOrder).toBeLessThan(readyOrder);
  });

  it('calls googleAuth with the active nonce and invokes onSuccess on a successful credential', async () => {
    const callbacks = makeCallbacks();
    const service = new GoogleAuthService(container, callbacks);

    await service.init();
    const [{ callback }] = fakeGis.initialize.mock.calls[0] as [GoogleIdInitializeConfig];

    await callback({ credential: 'id-token' });

    expect(mockGoogleAuth).toHaveBeenCalledWith({ credential: 'id-token', nonce: 'n-1' });
    expect(callbacks.onSuccess).toHaveBeenCalledTimes(1);
    expect(callbacks.onFatalError).not.toHaveBeenCalled();
  });

  it('on NONCE_NOT_FOUND from googleAuth: silently re-fetches a fresh nonce and re-renders the button', async () => {
    mockGoogleAuth
      .mockRejectedValueOnce(nonceErrorWith('NONCE_NOT_FOUND'))
      .mockResolvedValueOnce(undefined);
    mockGetGoogleNonce
      .mockResolvedValueOnce({ nonce: 'n-1' })
      .mockResolvedValueOnce({ nonce: 'n-2' });

    const callbacks = makeCallbacks();
    const service = new GoogleAuthService(container, callbacks);
    await service.init();

    const [{ callback: firstCallback }] = fakeGis.initialize.mock.calls[0] as [
      GoogleIdInitializeConfig,
    ];
    await firstCallback({ credential: 'id-token' });

    expect(mockGetGoogleNonce).toHaveBeenCalledTimes(2);
    expect(fakeGis.initialize).toHaveBeenCalledTimes(2);
    expect(fakeGis.initialize.mock.calls[1][0]).toEqual(
      expect.objectContaining({ nonce: 'n-2' }),
    );
    expect(fakeGis.renderButton).toHaveBeenCalledTimes(2);
    expect(fakeGis.prompt).toHaveBeenCalledTimes(2);
    expect(callbacks.onFatalError).not.toHaveBeenCalled();
  });

  it('on a second NONCE_NOT_FOUND: invokes onFatalError without another re-init (no infinite loop)', async () => {
    mockGoogleAuth
      .mockRejectedValueOnce(nonceErrorWith('NONCE_NOT_FOUND'))
      .mockRejectedValueOnce(nonceErrorWith('NONCE_NOT_FOUND'));

    const callbacks = makeCallbacks();
    const service = new GoogleAuthService(container, callbacks);
    await service.init();

    const [{ callback: firstCallback }] = fakeGis.initialize.mock.calls[0] as [
      GoogleIdInitializeConfig,
    ];
    await firstCallback({ credential: 'id-token-1' });
    await flushPromises();

    expect(fakeGis.initialize).toHaveBeenCalledTimes(2);
    const [{ callback: secondCallback }] = fakeGis.initialize.mock.calls[1] as [
      GoogleIdInitializeConfig,
    ];
    await secondCallback({ credential: 'id-token-2' });
    await flushPromises();

    expect(callbacks.onFatalError).toHaveBeenCalledTimes(1);
    expect(fakeGis.prompt).toHaveBeenCalledTimes(2);
  });

  it('on a non-nonce error from googleAuth: invokes onFatalError and does NOT re-init', async () => {
    const otherError = nonceErrorWith('INVALID_AUTH');
    mockGoogleAuth.mockRejectedValueOnce(otherError);

    const callbacks = makeCallbacks();
    const service = new GoogleAuthService(container, callbacks);
    await service.init();

    const [{ callback }] = fakeGis.initialize.mock.calls[0] as [GoogleIdInitializeConfig];
    await callback({ credential: 'id-token' });

    expect(callbacks.onFatalError).toHaveBeenCalledWith(otherError);
    expect(mockGetGoogleNonce).toHaveBeenCalledTimes(1);
    expect(fakeGis.initialize).toHaveBeenCalledTimes(1);
  });

  it('stopInit cancels the active prompt after a successful init', async () => {
    const service = new GoogleAuthService(container, makeCallbacks());

    await service.init();
    service.stopInit();

    expect(fakeGis.cancel).toHaveBeenCalledTimes(1);
  });

  it('stopInit during init() suppresses any subsequent GIS calls and callbacks (no leak after disposal)', async () => {
    let resolveNonce!: (value: { nonce: string }) => void;
    mockGetGoogleNonce.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveNonce = resolve;
      }),
    );

    const callbacks = makeCallbacks();
    const service = new GoogleAuthService(container, callbacks);
    const initPromise = service.init();

    // Allow loadGisScript to resolve, then dispose before the nonce arrives.
    await flushPromises();
    service.stopInit();
    resolveNonce({ nonce: 'late-nonce' });
    await initPromise;

    expect(fakeGis.initialize).not.toHaveBeenCalled();
    expect(fakeGis.renderButton).not.toHaveBeenCalled();
    expect(fakeGis.prompt).not.toHaveBeenCalled();
    expect(callbacks.onReady).not.toHaveBeenCalled();
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
    expect(callbacks.onFatalError).not.toHaveBeenCalled();
  });

  it('stopInit after init() but before credential callback: googleAuth result does not invoke onSuccess', async () => {
    let resolveAuth!: () => void;
    mockGoogleAuth.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveAuth = resolve;
      }),
    );

    const callbacks = makeCallbacks();
    const service = new GoogleAuthService(container, callbacks);
    await service.init();

    const [{ callback }] = fakeGis.initialize.mock.calls[0] as [GoogleIdInitializeConfig];
    const credentialPromise = callback({ credential: 'id-token' });

    service.stopInit();
    resolveAuth();
    await credentialPromise;

    expect(callbacks.onSuccess).not.toHaveBeenCalled();
    expect(callbacks.onFatalError).not.toHaveBeenCalled();
  });

});
