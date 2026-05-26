import { Test, TestingModule } from '@nestjs/testing';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleAuthService } from './google-auth.service';
import { TokenService } from './token.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { AppConfigService } from '../../config/app-config.service';
import { ApiAuthorizationError, ApiNonceNotFoundError } from '../../errors';

const CLIENT_ID = 'test-client-id';

type NonceRepoMock = {
  get: jest.Mock;
  set: jest.Mock;
  clear: jest.Mock;
};

const makeTicket = (payload: Partial<TokenPayload> | null) => ({
  getPayload: () => payload,
});

const makePayload = (
  over: Partial<TokenPayload> = {},
): Partial<TokenPayload> => ({
  sub: 'g-sub-1',
  email: 'a@b.com',
  email_verified: true,
  nonce: 'nonce-1',
  ...over,
});

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let usersService: {
    findByGoogleId: jest.Mock;
    findByEmail: jest.Mock;
    linkGoogleId: jest.Mock;
    create: jest.Mock;
  };
  let nonceRepo: NonceRepoMock;
  let verifyIdTokenSpy: jest.SpyInstance;
  let createSimpleRepository: jest.Mock;

  beforeEach(async () => {
    usersService = {
      findByGoogleId: jest.fn(),
      findByEmail: jest.fn(),
      linkGoogleId: jest.fn().mockResolvedValue(undefined),
      create: jest.fn(),
    };

    nonceRepo = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      clear: jest.fn().mockResolvedValue(1),
    };

    createSimpleRepository = jest.fn().mockReturnValue(nonceRepo);

    const tokenService = {
      accessToken: { generate: jest.fn().mockResolvedValue('access-token') },
      refreshToken: { generate: jest.fn().mockResolvedValue('refresh-token') },
    };

    const appConfig = {
      googleAuth: { GOOGLE_CLIENT_ID: CLIENT_ID },
    };

    const redisService = { createSimpleRepository };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthService,
        { provide: AppConfigService, useValue: appConfig },
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(GoogleAuthService);

    verifyIdTokenSpy = jest
      .spyOn(OAuth2Client.prototype, 'verifyIdToken')
      .mockResolvedValue(makeTicket(makePayload()) as never);
  });

  afterEach(() => {
    verifyIdTokenSpy.mockRestore();
  });

  describe('constructor', () => {
    it('creates the nonce repository under "oauth:nonce" with 300s TTL', () => {
      // Nonce is minted on mount and may sit until the user clicks the Google
      // button — 300s covers a typical auth-page session; expiry triggers a
      // client-side re-init via NONCE_NOT_FOUND.
      expect(createSimpleRepository).toHaveBeenCalledWith('oauth:nonce', 300);
    });
  });

  describe('mintNonce', () => {
    it('returns a 64-char hex string (32 random bytes)', async () => {
      const nonce = await service.mintNonce();

      expect(nonce).toMatch(/^[0-9a-f]{64}$/);
    });

    it('stores the nonce in the repository with sentinel value', async () => {
      const nonce = await service.mintNonce();

      expect(nonceRepo.set).toHaveBeenCalledTimes(1);
      expect(nonceRepo.set).toHaveBeenCalledWith(nonce, '1');
    });
  });

  describe('signIn', () => {
    it('returning user path: findByGoogleId hit returns existing user, no link, no create, tokens issued', async () => {
      // FR-6 / AC-2 returning: lookup by googleId wins
      const existing = { id: 'u-1', email: 'a@b.com' };
      usersService.findByGoogleId.mockResolvedValue(existing);
      nonceRepo.get.mockResolvedValue('1');

      const result = await service.signIn({
        credential: 'tok',
        nonce: 'nonce-1',
      });

      expect(usersService.findByGoogleId).toHaveBeenCalledWith('g-sub-1');
      expect(usersService.findByEmail).not.toHaveBeenCalled();
      expect(usersService.linkGoogleId).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'u-1', email: 'a@b.com' },
      });
    });

    it('link path: googleId miss + email hit calls linkGoogleId exactly once and issues tokens', async () => {
      // FR-5 / AC-2: existing email-password user, link Google without password
      const existing = { id: 'u-2', email: 'a@b.com' };
      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(existing);
      nonceRepo.get.mockResolvedValue('1');

      const result = await service.signIn({
        credential: 'tok',
        nonce: 'nonce-1',
      });

      expect(usersService.findByEmail).toHaveBeenCalledWith('a@b.com');
      expect(usersService.linkGoogleId).toHaveBeenCalledTimes(1);
      expect(usersService.linkGoogleId).toHaveBeenCalledWith('u-2', 'g-sub-1');
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result.user).toEqual({ id: 'u-2', email: 'a@b.com' });
    });

    it('create path: both lookups miss → creates user with email, googleId, password: null', async () => {
      // FR-4 / AC-1: new user via Google
      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: 'u-3', email: 'a@b.com' });
      nonceRepo.get.mockResolvedValue('1');

      const result = await service.signIn({
        credential: 'tok',
        nonce: 'nonce-1',
      });

      expect(usersService.create).toHaveBeenCalledWith({
        email: 'a@b.com',
        googleId: 'g-sub-1',
        password: null,
      });
      expect(usersService.linkGoogleId).not.toHaveBeenCalled();
      expect(result.user).toEqual({ id: 'u-3', email: 'a@b.com' });
    });

    it('rejects with ApiAuthorizationError when payload.email_verified is false', async () => {
      // FR-3 / NFR-2 / AC-3: reject when Google reports email_verified: false
      verifyIdTokenSpy.mockResolvedValue(
        makeTicket(makePayload({ email_verified: false })) as never,
      );

      await expect(
        service.signIn({ credential: 'tok', nonce: 'nonce-1' }),
      ).rejects.toBeInstanceOf(ApiAuthorizationError);

      expect(usersService.findByGoogleId).not.toHaveBeenCalled();
      expect(nonceRepo.clear).not.toHaveBeenCalled();
    });

    it('rejects with ApiAuthorizationError when payload.nonce mismatches the request nonce', async () => {
      verifyIdTokenSpy.mockResolvedValue(
        makeTicket(makePayload({ nonce: 'something-else' })) as never,
      );

      await expect(
        service.signIn({ credential: 'tok', nonce: 'nonce-1' }),
      ).rejects.toBeInstanceOf(ApiAuthorizationError);

      expect(usersService.findByGoogleId).not.toHaveBeenCalled();
      expect(nonceRepo.clear).not.toHaveBeenCalled();
    });

    it('rejects with ApiNonceNotFoundError when the nonce key is missing in Redis (expired or already consumed)', async () => {
      nonceRepo.get.mockResolvedValue(null);

      await expect(
        service.signIn({ credential: 'tok', nonce: 'nonce-1' }),
      ).rejects.toBeInstanceOf(ApiNonceNotFoundError);

      expect(usersService.findByGoogleId).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('rejects with ApiAuthorizationError when OAuth2Client.verifyIdToken throws', async () => {
      verifyIdTokenSpy.mockRejectedValue(new Error('invalid signature'));

      await expect(
        service.signIn({ credential: 'tok', nonce: 'nonce-1' }),
      ).rejects.toBeInstanceOf(ApiAuthorizationError);

      expect(nonceRepo.get).not.toHaveBeenCalled();
      expect(nonceRepo.clear).not.toHaveBeenCalled();
    });

    it('rejects with ApiAuthorizationError when payload is missing sub or email', async () => {
      verifyIdTokenSpy.mockResolvedValue(
        makeTicket(makePayload({ sub: undefined })) as never,
      );

      await expect(
        service.signIn({ credential: 'tok', nonce: 'nonce-1' }),
      ).rejects.toBeInstanceOf(ApiAuthorizationError);
    });

    it('clears the nonce key exactly once on the success path (DoS resistance — clear only after all checks pass)', async () => {
      // Anchor: google-auth.service.ts:42 "burning the nonce before this would allow DoS"
      // Nonce is preserved on every rejection branch; consumed only on success.
      usersService.findByGoogleId.mockResolvedValue({
        id: 'u-1',
        email: 'a@b.com',
      });
      nonceRepo.get.mockResolvedValue('1');

      await service.signIn({ credential: 'tok', nonce: 'nonce-1' });

      expect(nonceRepo.clear).toHaveBeenCalledTimes(1);
      expect(nonceRepo.clear).toHaveBeenCalledWith('nonce-1');
    });
  });
});
