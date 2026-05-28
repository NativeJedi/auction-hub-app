// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockConfirmEmailServer, mockSessionCreate } = vi.hoisted(() => ({
  mockConfirmEmailServer: vi.fn(),
  mockSessionCreate: vi.fn(),
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
  confirmEmailServer: mockConfirmEmailServer,
}));

vi.mock('@/src/services/session', () => ({
  sessionStorage: { create: mockSessionCreate },
}));

import { GET } from './route';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';

const makeRequest = (code?: string) => {
  const url = code
    ? `http://localhost/api/auth/confirm-email?code=${code}`
    : 'http://localhost/api/auth/confirm-email';
  return new Request(url, { method: 'GET' });
};

describe('GET /api/auth/confirm-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionCreate.mockResolvedValue({ id: 'sess-1' });
  });

  it('forwards code query param to confirmEmailServer and creates a session + sets cookie on success', async () => {
    // AC#2: BFF verifies the email, auto-logs the user in by creating a session
    mockConfirmEmailServer.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'u-1', email: 'a@b.com' },
    });

    const res = await GET(makeRequest('valid-code'));
    const body = await res.json();

    expect(mockConfirmEmailServer).toHaveBeenCalledWith('valid-code');
    expect(mockSessionCreate).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(res.status).toBe(200);
    expect(body).toEqual({ user: { id: 'u-1', email: 'a@b.com' } });

    const cookie = res.cookies.get(SESSION_COOKIE_NAME);
    expect(cookie?.value).toBe('sess-1');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.path).toBe('/');
  });

  it('forwards a 403 INVALID_CONFIRMATION_TOKEN error from the server verbatim', async () => {
    // FR-3: expired or already-used code must surface the correct status to the client
    mockConfirmEmailServer.mockRejectedValue({
      response: { status: 403, data: { message: 'INVALID_CONFIRMATION_TOKEN' } },
    });

    const res = await GET(makeRequest('expired-code'));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ message: 'INVALID_CONFIRMATION_TOKEN' });
  });

  it('returns 500 when code is absent and confirmEmailServer throws a non-response error', async () => {
    // withNextErrorResponse wraps unknown errors as 500
    mockConfirmEmailServer.mockRejectedValue(new Error('unexpected failure'));

    const res = await GET(makeRequest()); // no code → '' passed to confirmEmailServer
    const body = await res.json();

    expect(mockConfirmEmailServer).toHaveBeenCalledWith('');
    expect(res.status).toBe(500);
    expect(body).toEqual({ message: 'unexpected failure' });
  });
});
