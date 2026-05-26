// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGoogleNonceServer } = vi.hoisted(() => ({
  mockGoogleNonceServer: vi.fn(),
}));

vi.mock('@/src/api/auctions-api/requests/auth', () => ({
  googleNonceServer: mockGoogleNonceServer,
}));

import { GET } from './route';

const makeRequest = () =>
  new Request('http://localhost/api/auth/google/nonce', { method: 'GET' });

describe('GET /api/auth/google/nonce', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('proxies the Nest response and returns { nonce }', async () => {
    // T-003 §5 DoD: transparent proxy, returns Nest body unchanged
    mockGoogleNonceServer.mockResolvedValue({ nonce: 'abc123' });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(mockGoogleNonceServer).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(body).toEqual({ nonce: 'abc123' });
  });

  it('sets no cookies on the response', async () => {
    // T-003 §5 DoD: no cookie, no session creation on nonce path
    mockGoogleNonceServer.mockResolvedValue({ nonce: 'abc123' });

    const res = await GET(makeRequest());

    expect(res.cookies.getAll()).toEqual([]);
  });

  it('forwards Nest error status and body verbatim', async () => {
    mockGoogleNonceServer.mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'redis unavailable' },
      },
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ message: 'redis unavailable' });
  });
});
