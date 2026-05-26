// @vitest-environment jsdom
import { render, waitFor, act, cleanup } from '@testing-library/react';
import { createElement, useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

const { ServiceMock, serviceInstances } = vi.hoisted(() => {
  type ServiceCallbacks = {
    onReady: () => void;
    onSuccess: () => void;
    onFatalError: (cause: unknown) => void;
  };
  type ServiceInstance = {
    init: ReturnType<typeof vi.fn>;
    stopInit: ReturnType<typeof vi.fn>;
    callbacks: ServiceCallbacks;
  };
  const instances: ServiceInstance[] = [];

  class FakeService {
    init: ReturnType<typeof vi.fn>;
    stopInit: ReturnType<typeof vi.fn>;
    callbacks: ServiceCallbacks;
    constructor(_container: HTMLElement, callbacks: ServiceCallbacks) {
      this.callbacks = callbacks;
      this.init = vi.fn().mockResolvedValue(undefined);
      this.stopInit = vi.fn();
      instances.push(this);
    }
  }

  return {
    ServiceMock: FakeService as unknown as new (
      container: HTMLElement,
      callbacks: ServiceCallbacks,
    ) => unknown,
    serviceInstances: instances,
  };
});

const { routerObject } = vi.hoisted(() => ({
  routerObject: { push: mockPush },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerObject,
}));

vi.mock('./googleAuthService', () => ({
  GoogleAuthService: ServiceMock,
}));

import { useGoogleSignIn } from './useGoogleSignIn';

type HookResult = ReturnType<typeof useGoogleSignIn>;

const renderWithHook = () => {
  const captured: { current: HookResult | null } = { current: null };
  const Harness = () => {
    const result = useGoogleSignIn();
    useEffect(() => {
      captured.current = result;
    });
    captured.current = result;
    return createElement('div', { ref: result.containerRef });
  };
  const utils = render(createElement(Harness));
  return { ...utils, getHook: () => captured.current! };
};

const getLatestService = () => {
  const last = serviceInstances[serviceInstances.length - 1];
  if (!last) throw new Error('GoogleAuthService was not instantiated');
  return last;
};

describe('useGoogleSignIn', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    serviceInstances.length = 0;
  });

  it('instantiates GoogleAuthService with the rendered container and calls init()', async () => {
    const { container } = renderWithHook();

    await waitFor(() => expect(serviceInstances.length).toBe(1));
    const service = getLatestService();
    expect(service.init).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toBeInstanceOf(HTMLElement);
  });

  it('navigates to /crm/auctions when the service calls onSuccess', async () => {
    renderWithHook();
    await waitFor(() => expect(serviceInstances.length).toBe(1));
    const service = getLatestService();

    act(() => service.callbacks.onSuccess());

    expect(mockPush).toHaveBeenCalledWith('/crm/auctions');
  });

  it('sets error state when the service calls onFatalError', async () => {
    const { getHook } = renderWithHook();
    await waitFor(() => expect(serviceInstances.length).toBe(1));
    const service = getLatestService();

    const apiError = { data: { message: 'Authorization error', reason: 'INVALID_AUTH' } };
    act(() => service.callbacks.onFatalError(apiError));

    await waitFor(() => expect(getHook().error).toBe(apiError));
  });

  it('unmount triggers service.stopInit()', async () => {
    const { unmount } = renderWithHook();
    await waitFor(() => expect(serviceInstances.length).toBe(1));
    const service = getLatestService();

    unmount();

    expect(service.stopInit).toHaveBeenCalledTimes(1);
  });
});
