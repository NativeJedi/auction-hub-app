// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGoogleAuthServer, mockSessionCreate } = vi.hoisted(() => ({
  mockGoogleAuthServer: vi.fn(),
  mockSessionCreate: vi.fn(),
}));

vi.mock('@/config/server', () => ({
  getServerConfig: () => ({
    API_URL: 'http://test',
    REDIS_URL: 'redis://test',
    JWT_ACCESS_TTL: 300,
    JWT_REFRESH_TTL: 3600,
  }),
}));

vi.mock('@/src/api/auctions-api/requests/auth', () => ({
  googleAuthServer: mockGoogleAuthServer,
}));

vi.mock('@/src/services/session', () => ({
  sessionStorage: { create: mockSessionCreate },
}));

import { POST } from './route';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/auth/google', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('POST /api/auth/google', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionCreate.mockResolvedValue({ id: 'sess-1' });
  });

  it('forwards { credential, nonce } to Nest and returns { user } on success', async () => {
    // FR-6 / AC-1: BFF proxies the body and returns AuthResponse shape
    mockGoogleAuthServer.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'u-1', email: 'a@b.com' },
    });

    const res = await POST(makeRequest({ credential: 'tok', nonce: 'n-1' }));
    const body = await res.json();

    expect(mockGoogleAuthServer).toHaveBeenCalledWith({
      credential: 'tok',
      nonce: 'n-1',
    });
    expect(res.status).toBe(200);
    expect(body).toEqual({ user: { id: 'u-1', email: 'a@b.com' } });
  });

  it('creates a session and sets the session_id cookie on success', async () => {
    mockGoogleAuthServer.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'u-1', email: 'a@b.com' },
    });

    const res = await POST(makeRequest({ credential: 'tok', nonce: 'n-1' }));

    expect(mockSessionCreate).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const cookie = res.cookies.get(SESSION_COOKIE_NAME);
    expect(cookie?.value).toBe('sess-1');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('lax');
    expect(cookie?.path).toBe('/');
  });

  it('returns 400 when credential is missing from the body', async () => {
    const res = await POST(makeRequest({ nonce: 'n-1' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ message: 'credential and nonce are required' });
    expect(mockGoogleAuthServer).not.toHaveBeenCalled();
  });

  it('returns 400 when nonce is missing from the body', async () => {
    const res = await POST(makeRequest({ credential: 'tok' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ message: 'credential and nonce are required' });
    expect(mockGoogleAuthServer).not.toHaveBeenCalled();
  });

  it('forwards Nest 401 status and error body verbatim', async () => {
    // FR-3 / NFR-2 / AC-3: BFF must surface the auth error to the caller
    mockGoogleAuthServer.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    });

    const res = await POST(makeRequest({ credential: 'tok', nonce: 'n-1' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ message: 'Unauthorized' });
  });
});
