import { cookies } from 'next/headers';
import { getRedis } from '../redis';
import { randomUUID } from 'crypto';
import { getServerConfig } from '@/config/server';
import { getSessionTtl, getSessionExpirationGap } from '@/src/services/session/constants';
import { refreshTokenServer } from '@/src/api/auctions-api/requests/auth';

type SessionData = {
  accessToken: string;
  refreshToken: string;
};

export type Session = SessionData & {
  id: string;
  accessTokenExpiresAt: number;
};

/*
 * It's possible to have a race condition if you have multiple instances of Next server.
 * But it's a very small chance and acceptable for the current business state.
 * */
declare global {
  // eslint-disable-next-line no-var
  var sessionRefreshingPromise: Promise<Session | undefined> | undefined;
}

class SessionStorage {
  private getSessionKey(sessionId: string) {
    return `session:${sessionId}`;
  }

  get accessTokenExpiresAt() {
    return Date.now() + getServerConfig().JWT_ACCESS_TTL * 1000;
  }

  private readonly isExpired = (expiresAt: Session['accessTokenExpiresAt']) =>
    Date.now() >= expiresAt - getSessionExpirationGap();

  async create(data: SessionData) {
    const id = randomUUID();

    const session: Session = { id, ...data, accessTokenExpiresAt: this.accessTokenExpiresAt };

    await getRedis().set(this.getSessionKey(id), JSON.stringify(session), 'EX', getSessionTtl());

    return session;
  }

  async get(id: Session['id']): Promise<Session | null> {
    const raw = await getRedis().get(this.getSessionKey(id));

    if (!raw) return null;

    const session = JSON.parse(raw.toString());

    return session;
  }

  async update(id: Session['id'], data: SessionData) {
    await getRedis().del(this.getSessionKey(id));

    const sessionData = {
      id,
      ...data,
      accessTokenExpiresAt: this.accessTokenExpiresAt,
    };

    await getRedis().set(
      this.getSessionKey(id),
      JSON.stringify(sessionData),
      'EX',
      getSessionTtl()
    );

    return sessionData;
  }

  async delete(id: Session['id']) {
    await getRedis().del(this.getSessionKey(id));
  }

  async getValidSession(id: Session['id']) {
    const session = await this.get(id);

    if (!session) return;

    if (!this.isExpired(session.accessTokenExpiresAt)) {
      return session;
    }

    if (!global.sessionRefreshingPromise) {
      global.sessionRefreshingPromise = refreshTokenServer({ refreshToken: session.refreshToken })
        .then(async ({ accessToken, refreshToken }) => {
          const data = { accessToken, refreshToken };

          const updatedSession = await this.update(id, data);

          return updatedSession;
        })
        .catch((e) => {
          console.error(e);
          return undefined;
        })
        .finally(() => {
          global.sessionRefreshingPromise = undefined;
        });
    }

    return sessionRefreshingPromise;
  }
}

const sessionStorage = new SessionStorage();

export { sessionStorage };
