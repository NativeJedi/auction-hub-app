import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { getServerConfig } from '@/config/server';

// Pure constant — no config dependency, so importing it (e.g. in middleware or
// pages just for the cookie name) does not pull in server env validation.
export const SESSION_COOKIE_NAME = 'session_id';

// Config-derived values are lazy: computed on first call at runtime, never at
// module import / build time.
export const getSessionExpirationGap = () => (getServerConfig().JWT_ACCESS_TTL > 60 ? 60 : 0); // in seconds

export const getSessionTtl = () => getServerConfig().JWT_REFRESH_TTL + getSessionExpirationGap(); // in seconds

export const SESSION_COOKIE_SETTINGS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  // Lazy getter — TTL resolved when the cookie is actually set (runtime).
  get maxAge() {
    return getSessionTtl();
  },
};
