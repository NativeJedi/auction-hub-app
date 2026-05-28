// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockResendConfirmationServer } = vi.hoisted(() => ({
  mockResendConfirmationServer: vi.fn(),
}));

vi.mock('@/config/server', () => ({
  AppServerConfig: {
    API_URL: 'http://test',
    REDIS_URL: 'redis://test',
    JWT_ACCESS_TTL: 300,
    JWT_REFRESH_TTL: 3600,
  },
}));

vi.mock('@/src/api/auctions-api/requests/auth', () => ({
  resendConfirmationServer: mockResendConfirmationServer,
}));

import { POST } from './route';

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/auth/resend-confirmation', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

describe('POST /api/auth/resend-confirmation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('forwards email body to resendConfirmationServer and returns { status }', async () => {
    // AC#4: BFF proxies the resend request and returns the Nest response unchanged
    mockResendConfirmationServer.mockResolvedValue({ status: 'email_sent' });

    const res = await POST(makeRequest({ email: 'user@example.com' }));
    const body = await res.json();

    expect(mockResendConfirmationServer).toHaveBeenCalledWith('user@example.com');
    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'email_sent' });
  });

  it('forwards a 429 RESEND_LIMIT_EXCEEDED error from the server verbatim', async () => {
    // FR-4: rate-limit error must surface to the client so the UI can show the right message
    mockResendConfirmationServer.mockRejectedValue({
      response: { status: 429, data: { message: 'RESEND_LIMIT_EXCEEDED' } },
    });

    const res = await POST(makeRequest({ email: 'user@example.com' }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ message: 'RESEND_LIMIT_EXCEEDED' });
  });
});
