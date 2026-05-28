import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

type AuthResponseBody = {
  user: { id: string };
  accessToken: string;
  refreshToken: string;
};

export class RequestService {
  accessToken: string;

  private readonly app: INestApplication;

  constructor(app: INestApplication) {
    this.app = app;
  }

  makeRequest({
    url,
    method,
    body,
  }: {
    url: string;
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    body?: Record<string, unknown>;
  }) {
    let baseRequest = request(
      this.app.getHttpServer() as Parameters<typeof request>[0],
    )[method](url);

    if (this.accessToken) {
      baseRequest = baseRequest.set(
        'Authorization',
        `Bearer ${this.accessToken}`,
      );
    }

    return baseRequest.send(body);
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }
}

export class TestUser {
  id: string;
  email: string;
  password: string;

  requestService: RequestService;

  _refreshToken: string;
  _createdAuctionId: string;

  constructor(
    app: INestApplication,
    { email, password }: { email: string; password: string },
  ) {
    this.email = email;
    this.password = password;
    this.requestService = new RequestService(app);
  }

  register() {
    const req = this.requestService.makeRequest({
      url: '/auth/register',
      method: 'post',
      body: { email: this.email, password: this.password },
    });

    void req.then((response) => {
      const body = response.body as AuthResponseBody;
      this.id = body.user.id;
      this.requestService.setAccessToken(body.accessToken);
      this._refreshToken = body.refreshToken;
      return response;
    });

    return req;
  }

  login({ password = this.password } = {}) {
    const req = this.requestService.makeRequest({
      url: '/auth/login',
      method: 'post',
      body: { email: this.email, password },
    });

    void req.then((response) => {
      if (response.status !== 200) return;
      const body = response.body as AuthResponseBody;
      this.id = body.user.id;
      this.requestService.setAccessToken(body.accessToken);
      this._refreshToken = body.refreshToken;
      return response;
    });

    return req;
  }

  refreshToken() {
    const req = this.requestService.makeRequest({
      url: '/auth/refresh',
      method: 'post',
      body: { refreshToken: this._refreshToken },
    });

    void req.then((response) => {
      const body = response.body as Pick<
        AuthResponseBody,
        'accessToken' | 'refreshToken'
      >;
      this.requestService.setAccessToken(body.accessToken);
      this._refreshToken = body.refreshToken;
      return response;
    });

    return req;
  }

  logout() {
    return this.requestService.makeRequest({
      url: '/auth/logout',
      method: 'post',
    });
  }

  createAuction() {
    const req = this.requestService.makeRequest({
      url: '/auctions',
      method: 'post',
      body: {
        name: 'Test auction',
        description: 'Test description',
      },
    });

    void req.then((response) => {
      this._createdAuctionId = (response.body as { id: string }).id;
      return response;
    });

    return req;
  }
}
