import { headers } from 'next/headers';
import { nextSessionStorage } from '@/src/services/session/nextSessionStorage';

// Forward the real client IP to the api so its rate-limiter sees the actual
// visitor instead of the client container. Cloudflare provides it in
// `CF-Connecting-IP`; falls back to standard proxy headers off Cloudflare
// (e.g. local dev). Runs for every request, including skipAuth auth calls.
export const getIpHeader = async () => {
  const headerStore = await headers();

  const realIp =
    headerStore.get('cf-connecting-ip') ??
    headerStore.get('x-real-ip') ??
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim();

  return realIp;
};

export const getAuthorizationHeader = async () => {
  const session = await nextSessionStorage.getValidSession();
  if (!session) return;
  return `Bearer ${session.accessToken}`;
};

export const createServerRequestHeaders = async (skipAuth: boolean) => {
  const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

  const realIp = await getIpHeader();

  if (realIp) {
    requestHeaders['X-Forwarded-For'] = realIp;
  }

  if (skipAuth) {
    return requestHeaders;
  }

  const authHeader = await getAuthorizationHeader();

  if (authHeader) {
    requestHeaders['Authorization'] = authHeader;
  }

  return requestHeaders;
};
