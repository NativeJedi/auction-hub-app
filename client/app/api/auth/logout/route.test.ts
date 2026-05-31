// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLogoutServer, mockSessionDelete, mockCookieGet } = vi.hoisted(() => ({
  mockLogoutServer: vi.fn(),
  mockSessionDelete: vi.fn(),
  mockCookieGet: vi.fn(),
}));

vi.mock('@/config/server', () => ({
  AppServerConfig: {
    API_URL: 'http://test',
    REDIS_URL: 'redis://test',
    JWT_ACCESS_TTL: 300,
    JWT_REFRESH_TTL: 3600,
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));

vi.mock('@/src/api/auctions-api/requests/auth', () => ({
  logoutServer: mockLogoutServer,
}));

vi.mock('@/src/services/session', () => ({
  sessionStorage: { delete: mockSessionDelete },
}));

import { POST } from './route';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears the session cookie on the response so the browser drops it', async () => {
    // Bug: after logout the cookie persisted, so the landing still read it as authenticated.
    mockCookieGet.mockReturnValue({ value: 'sess-1' });
    mockLogoutServer.mockResolvedValue({});

    const res = await POST(new Request('http://localhost/api/auth/logout', { method: 'POST' }));

    expect(mockSessionDelete).toHaveBeenCalledWith('sess-1');

    const cookie = res.cookies.get(SESSION_COOKIE_NAME);
    expect(cookie?.value).toBe('');
    expect(cookie?.maxAge).toBe(0);
    expect(cookie?.path).toBe('/');
  });

  it('returns 401 when there is no session cookie', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const res = await POST(new Request('http://localhost/api/auth/logout', { method: 'POST' }));

    expect(res.status).toBe(401);
    expect(mockLogoutServer).not.toHaveBeenCalled();
  });
});
