import { cookies } from 'next/headers';
import { sessionStorage } from '@/src/services/session';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_SETTINGS } from '@/src/services/session/constants';
import type { Session } from '@/src/services/session';

class NextSessionStorage {
  async getValidSession(): Promise<Session | undefined> {
    const sessionId = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!sessionId) return;
    return sessionStorage.getValidSession(sessionId);
  }

  async create(data: { accessToken: string; refreshToken: string }): Promise<Session> {
    const session = await sessionStorage.create(data);
    (await cookies()).set(SESSION_COOKIE_NAME, session.id, SESSION_COOKIE_SETTINGS);
    return session;
  }

  async delete(): Promise<void> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionId) {
      await sessionStorage.delete(sessionId);
    }
    cookieStore.set(SESSION_COOKIE_NAME, '', { ...SESSION_COOKIE_SETTINGS, maxAge: 0 });
  }
}

export const nextSessionStorage = new NextSessionStorage();
