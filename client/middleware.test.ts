// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';

const { mockGetValidSession } = vi.hoisted(() => ({
  mockGetValidSession: vi.fn(),
}));

// constants.ts (imported transitively via middleware.ts) pulls in config/server,
// which parses process.env at module load. Mock it like the sibling route tests do.
vi.mock('@/config/server', () => ({
  getServerConfig: () => ({
    API_URL: 'http://test',
    REDIS_URL: 'redis://test',
    JWT_ACCESS_TTL: 300,
    JWT_REFRESH_TTL: 3600,
  }),
}));

// The middleware validates the ACTUAL session via sessionStorage (Redis lookup +
// token refresh). Mock it so tests can drive the auth decision without infra.
vi.mock('@/src/services/session', () => ({
  sessionStorage: { getValidSession: mockGetValidSession },
}));

import middleware from './middleware';

// NextRequest parses the standard Cookie header, so this is how the middleware's
// `req.cookies.get(SESSION_COOKIE_NAME)` sees a session cookie.
const withSession = (url: string) =>
  new NextRequest(url, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=sess-1` },
  });

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no valid session unless a test opts in.
    mockGetValidSession.mockResolvedValue(null);
  });

  it("allows '/' through without a session (does not redirect to /crm/auth)", async () => {
    const res = await middleware(new NextRequest('http://localhost/'));

    expect(res.headers.get('location')).toBeNull();
  });

  it.each(['/robots.txt', '/sitemap.xml'])(
    'allows the SEO endpoint %s through without a session (crawlers send no cookie)',
    async (path) => {
      const res = await middleware(new NextRequest(`http://localhost${path}`));

      expect(res.headers.get('location')).toBeNull();
    }
  );

  it.each(['/privacy', '/terms'])(
    'allows the legal page %s through without a session',
    async (path) => {
      const res = await middleware(new NextRequest(`http://localhost${path}`));

      expect(res.headers.get('location')).toBeNull();
    }
  );

  it('redirects a protected route to /crm/auth and preserves the original path without a session', async () => {
    const res = await middleware(new NextRequest('http://localhost/crm/auctions'));

    const location = res.headers.get('location');
    expect(location).not.toBeNull();
    const redirectUrl = new URL(location as string);
    expect(redirectUrl.pathname).toBe('/crm/auth');
    expect(redirectUrl.searchParams.get('from')).toBe('/crm/auctions');
  });

  it('passes a known public slice (e.g. /room) through without a session', async () => {
    const res = await middleware(new NextRequest('http://localhost/room/abc'));

    expect(res.headers.get('location')).toBeNull();
  });

  it('passes a protected route through when a valid session is present', async () => {
    mockGetValidSession.mockResolvedValue({ id: 'sess-1' });

    const res = await middleware(withSession('http://localhost/crm/auctions'));

    expect(res.headers.get('location')).toBeNull();
    expect(mockGetValidSession).toHaveBeenCalledWith('sess-1');
  });

  it('redirects when a session cookie is present but the session is invalid', async () => {
    mockGetValidSession.mockResolvedValue(null);

    const res = await middleware(withSession('http://localhost/crm/auctions'));

    expect(res.headers.get('location')).not.toBeNull();
  });
});
