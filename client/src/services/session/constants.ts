import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { AppServerConfig } from '@/config/server';

export const SESSION_COOKIE_NAME = 'session_id';

export const SESSION_EXPIRATION_GAP = AppServerConfig.JWT_ACCESS_TTL > 60 ? 60 : 0; // in seconds

export const SESSION_TTL = AppServerConfig.JWT_REFRESH_TTL + SESSION_EXPIRATION_GAP; // in seconds

export const SESSION_COOKIE_SETTINGS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_TTL,
};
