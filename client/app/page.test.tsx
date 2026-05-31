// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCookieGet } = vi.hoisted(() => ({
  mockCookieGet: vi.fn(),
}));

// constants.ts (imported transitively via page.tsx) pulls in config/server,
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

import RootPage, { metadata } from './page';
import LandingPage from '@/src/modules/landing/LandingPage';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';

describe('RootPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the landing page (not a redirect) for an unauthenticated request — AC-1', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const element = await RootPage();

    expect(element.type).toBe(LandingPage);
    expect(element.props.isAuthenticated).toBe(false);
  });

  it('reads the session cookie and renders the landing with isAuthenticated=true — AC-4', async () => {
    mockCookieGet.mockReturnValue({ value: 'sess-1' });

    const element = await RootPage();

    expect(mockCookieGet).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
    expect(element.props.isAuthenticated).toBe(true);
  });
});

describe('RootPage metadata', () => {
  it('exposes title, description, and Open Graph for the landing root — T-003', () => {
    expect(metadata.title).toContain('AuctionHub');
    expect(metadata.title).toContain('Capture every bid in the room');
    expect(metadata.description).toContain('bid from their phone');
    expect(metadata.openGraph?.url).toBe('/');
  });
});
