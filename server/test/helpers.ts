import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

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
    body?: any;
  }) {
    let baseRequest = request(this.app.getHttpServer())[method](url);

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
    const request = this.requestService.makeRequest({
      url: '/auth/register',
      method: 'post',
      body: { email: this.email, password: this.password },
    });

    request.then((response) => {
      this.id = response.body.user.id;

      this.requestService.setAccessToken(response.body.accessToken);
      this._refreshToken = response.body.refreshToken;

      return response;
    });

    return request;
  }

  login({ password = this.password } = {}) {
    const request = this.requestService.makeRequest({
      url: '/auth/login',
      method: 'post',
      body: { email: this.email, password },
    });

    request.then((response) => {
      if (response.status !== 200) return;

      this.id = response.body.user.id;

      this.requestService.setAccessToken(response.body.accessToken);
      this._refreshToken = response.body.refreshToken;

      return response;
    });

    return request;
  }

  refreshToken() {
    const request = this.requestService.makeRequest({
      url: '/auth/refresh',
      method: 'post',
      body: { refreshToken: this._refreshToken },
    });

    request.then((response) => {
      this.requestService.setAccessToken(response.body.accessToken);
      this._refreshToken = response.body.refreshToken;
      return response;
    });

    return request;
  }

  logout() {
    return this.requestService.makeRequest({
      url: '/auth/logout',
      method: 'post',
    });
  }

  createAuction() {
    const request = this.requestService.makeRequest({
      url: '/auctions',
      method: 'post',
      body: {
        name: 'Test auction',
        description: 'Test description',
      },
    });

    request.then((response) => {
      this._createdAuctionId = response.body.id;
      return response;
    });

    return request;
  }
}
