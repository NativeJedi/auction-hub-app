// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockCookieGet } = vi.hoisted(() => ({
  mockCookieGet: vi.fn(),
}));

// constants.ts (imported transitively via middleware.ts) pulls in config/server,
// which parses process.env at module load. Mock it like the sibling route tests do.
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

import middleware from './middleware';

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows '/' through without a session (does not redirect to /crm/auth)", async () => {
    mockCookieGet.mockReturnValue(undefined);

    const res = await middleware(new NextRequest('http://localhost/'));

    expect(res.headers.get('location')).toBeNull();
  });

  it.each(['/robots.txt', '/sitemap.xml'])(
    'allows the SEO endpoint %s through without a session (crawlers send no cookie)',
    async (path) => {
      mockCookieGet.mockReturnValue(undefined);

      const res = await middleware(new NextRequest(`http://localhost${path}`));

      expect(res.headers.get('location')).toBeNull();
    }
  );

  it('redirects a protected route to /crm/auth and preserves the original path without a session', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const res = await middleware(new NextRequest('http://localhost/crm/auctions'));

    const location = res.headers.get('location');
    expect(location).not.toBeNull();
    const redirectUrl = new URL(location as string);
    expect(redirectUrl.pathname).toBe('/crm/auth');
    expect(redirectUrl.searchParams.get('from')).toBe('/crm/auctions');
  });

  it('passes a known public slice (e.g. /room) through without a session', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const res = await middleware(new NextRequest('http://localhost/room/abc'));

    expect(res.headers.get('location')).toBeNull();
  });

  it('passes a protected route through when a session cookie is present', async () => {
    mockCookieGet.mockReturnValue({ value: 'sess-1' });

    const res = await middleware(new NextRequest('http://localhost/crm/auctions'));

    expect(res.headers.get('location')).toBeNull();
  });
});
