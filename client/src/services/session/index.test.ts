import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/config/server', () => ({
  getServerConfig: () => ({
    API_URL: 'http://test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_TTL: 900,
    JWT_REFRESH_TTL: 172800,
  }),
}));

const { mockRedisGet, mockRefreshToken } = vi.hoisted(() => ({
  mockRedisGet: vi.fn(),
  mockRefreshToken: vi.fn(),
}));

vi.mock('../redis', () => ({
  getRedis: () => ({ get: mockRedisGet, set: vi.fn(), del: vi.fn() }),
}));

vi.mock('@/src/api/auctions-api/requests/auth', () => ({
  refreshTokenServer: mockRefreshToken,
}));

import { sessionStorage } from './index';

describe('SessionStorage.getValidSession', () => {
  afterEach(() => {
    global.sessionRefreshingPromise = undefined;
    vi.clearAllMocks();
  });

  it('returns undefined when token refresh fails instead of propagating the error', async () => {
    // Arrange — expired session so the refresh path is entered
    const expiredSession = {
      id: 'sess-1',
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresAt: 0, // epoch — always expired
    };
    mockRedisGet.mockResolvedValue(JSON.stringify(expiredSession));
    mockRefreshToken.mockRejectedValue(new Error('Refresh token expired'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const result = await sessionStorage.getValidSession('sess-1');

    // Assert
    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
