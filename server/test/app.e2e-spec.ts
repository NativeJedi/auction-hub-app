import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { StartedTestContainer } from 'testcontainers';
import { APP_MODULES } from '../src/app.module';
import { createPostgresContainer, createRedisContainer } from './containers';
import { ConfigModule } from '@nestjs/config';
import { loadTestConfig, loadTypeOrmTestConfig } from './configs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RequestService, TestUser } from './helpers';

jest.setTimeout(30000);

describe('App E2E', () => {
  let app: INestApplication;
  let postgresContainer: StartedTestContainer;
  let redisContainer: StartedTestContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    const { container: pgContainer, DATABASE_URL } =
      await createPostgresContainer();
    const { container: rdContainer, REDIS_URL } = await createRedisContainer();

    postgresContainer = pgContainer;
    redisContainer = rdContainer;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ...APP_MODULES,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () =>
              loadTestConfig({
                DATABASE_URL,
                REDIS_URL,
              }),
          ],
        }),
        TypeOrmModule.forRoot(loadTypeOrmTestConfig({ DATABASE_URL })),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    await app.close();
    await postgresContainer.stop();
    await redisContainer.stop();
  });

  describe('Protected routes', () => {
    type TestCase = {
      route: string;
      method: 'get' | 'post' | 'put' | 'delete' | 'patch';
      body?: any;
    };

    const TEST_CASES: TestCase[] = [
      {
        route: '/auth/logout',
        method: 'post',
      },
      {
        route: '/auctions',
        method: 'get',
      },
      {
        route: '/auctions',
        method: 'post',
        body: {
          name: 'Test auction',
          description: 'Test description',
        },
      },
      {
        route: '/auctions/123',
        method: 'get',
      },
      {
        route: '/auctions/123',
        method: 'patch',
        body: {
          name: 'Test auction',
          description: 'Test description',
        },
      },
      {
        route: '/auctions/123',
        method: 'delete',
      },
    ];

    let requestService: RequestService;

    beforeAll(async () => {
      requestService = new RequestService(app);
    });

    TEST_CASES.forEach(({ route, body, method }) => {
      test(`${[route]} should return 401 if not authenticated`, async () => {
        await requestService
          .makeRequest({
            url: route,
            method,
            body,
          })
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });
  });

  describe('Auth', () => {
    let testUser: TestUser;

    beforeAll(async () => {
      testUser = new TestUser(app, {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('[/auth/register] should create new user', async () => {
      const response = await testUser.register().expect(201);

      expect(response.body).toMatchObject({
        user: {
          id: expect.any(String),
          email: testUser.email,
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    test('[/auth/login] should login created user', async () => {
      const response = await testUser.login().expect(200);

      expect(response.body).toMatchObject({
        user: {
          id: expect.any(String),
          email: testUser.email,
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    test('[/auth/login] should return unauthorized with incorrect password', async () => {
      await testUser.login({ password: 'wrong-password' }).expect(401);
    });

    test('[/auth/refresh] should refresh access token', async () => {
      const response = await testUser.refreshToken().expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    test('[/auth/logout] should make refreshToken invalid', async () => {
      await testUser.logout();

      const response = await testUser.refreshToken();

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Invalid refresh token',
        error: 'Unauthorized',
      });
    });
  });

  describe('Auctions', () => {
    let testUser: TestUser;

    beforeAll(async () => {
      testUser = new TestUser(app, {
        email: 'auctions@email.com',
        password: 'password123',
      });

      await testUser.register();
    });

    test('[/auctions] GET should return empty list', async () => {
      const response = await testUser.requestService
        .makeRequest({
          url: '/auctions',
          method: 'get',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    let createdAuction: any;

    test('[/auctions] POST should create new auction', async () => {
      const TEST_AUCTION = {
        name: 'Test auction',
        description: 'Test description',
      };
      const response = await testUser.requestService
        .makeRequest({
          url: '/auctions',
          method: 'post',
          body: TEST_AUCTION,
        })
        .expect(201);

      createdAuction = response.body;

      expect(response.body).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(String),
        status: 'created',
        ...TEST_AUCTION,
      });
    });

    test('[/auctions/:id] GET should return auction by id', async () => {
      const response = await testUser.requestService
        .makeRequest({
          url: `/auctions/${createdAuction.id}`,
          method: 'get',
        })
        .expect(200);

      expect(response.body).toMatchObject(createdAuction);
    });

    test('[/auctions/:id] PATCH should update auction by id', async () => {
      const UPDATE_AUCTION = {
        name: 'Updated auction',
        description: 'Updated description',
      };
      const response = await testUser.requestService
        .makeRequest({
          url: `/auctions/${createdAuction.id}`,
          method: 'patch',
          body: UPDATE_AUCTION,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(String),
        status: 'created',
        ...UPDATE_AUCTION,
      });
    });

    test('[/auctions/:id] DELETE should delete auction by id', async () => {
      await testUser.requestService
        .makeRequest({
          url: `/auctions/${createdAuction.id}`,
          method: 'delete',
        })
        .expect(200);
    });
  });

  describe('Lots', () => {
    let testUser: TestUser;

    let createdLot: any;

    beforeAll(async () => {
      testUser = new TestUser(app, {
        email: 'lots-user@email.com',
        password: 'password123',
      });

      await testUser.register();
      await testUser.createAuction();
    });

    test('[/lots] GET should return empty list', async () => {
      const response = await testUser.requestService
        .makeRequest({
          url: `/auctions/${testUser._createdAuctionId}/lots`,
          method: 'get',
        })
        .expect(200);

      expect(response.body).toEqual([]);
    });

    test('[/lots] POST should create new lot', async () => {
      const TEST_LOT = {
        name: 'Test lot',
        description: 'Test description',
        startPrice: 500,
        currency: 'UAH',
      };

      const response = await testUser.requestService
        .makeRequest({
          url: `/auctions/${testUser._createdAuctionId}/lots`,
          method: 'post',
          body: {
            lots: [TEST_LOT],
          },
        })
        .expect(201);

      [createdLot] = response.body;

      expect(createdLot).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        status: 'created',
        ...TEST_LOT,
      });
    });

    test('[/lots/:id] GET should return lot by id', async () => {
      const response = await testUser.requestService
        .makeRequest({
          url: `/auctions/${testUser._createdAuctionId}/lots/${createdLot.id}`,
          method: 'get',
        })
        .expect(200);

      expect(response.body).toMatchObject(createdLot);
    });

    test('[/lots/:id] PATCH should update lot by id', async () => {
      const UPDATE_LOT = {
        name: 'Updated lot',
        description: 'Updated description',
        startPrice: 600,
        currency: 'UAH',
      };

      const response = await testUser.requestService
        .makeRequest({
          url: `/auctions/${testUser._createdAuctionId}/lots/${createdLot.id}`,
          method: 'patch',
          body: UPDATE_LOT,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        ...createdLot,
        ...UPDATE_LOT,
        updatedAt: expect.any(String),
      });
    });

    test('[/lots/:id] DELETE should delete lot by id', async () => {
      await testUser.requestService
        .makeRequest({
          url: `/auctions/${testUser._createdAuctionId}/lots/${createdLot.id}`,
          method: 'delete',
        })
        .expect(200);
    });
  });
});
