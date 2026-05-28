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
  getDel: jest.Mock;
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
    setEmailVerified: jest.Mock;
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
      setEmailVerified: jest.fn().mockResolvedValue(undefined),
    };

    nonceRepo = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      clear: jest.fn().mockResolvedValue(1),
      getDel: jest.fn(),
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
      nonceRepo.getDel.mockResolvedValue('1');

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
      nonceRepo.getDel.mockResolvedValue('1');

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

    it('create path: both lookups miss → creates user with email, googleId, password: null, emailVerified: true', async () => {
      // FR-5 / AC-5: new Google user is pre-verified — email_verified asserted at line 55
      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: 'u-3', email: 'a@b.com' });
      nonceRepo.getDel.mockResolvedValue('1');

      const result = await service.signIn({
        credential: 'tok',
        nonce: 'nonce-1',
      });

      expect(usersService.create).toHaveBeenCalledWith({
        email: 'a@b.com',
        googleId: 'g-sub-1',
        password: null,
        emailVerified: true,
      });
      expect(usersService.linkGoogleId).not.toHaveBeenCalled();
      expect(result.user).toEqual({ id: 'u-3', email: 'a@b.com' });
    });

    it('link path: existing unverified account → linkGoogleId called, resulting user can sign in (emailVerified set atomically)', async () => {
      // AC-5 / ADR-FEAT-008-02 §9: Google login on existing unverified account must atomically
      // set emailVerified in the same UPDATE as the googleId link — handled inside linkGoogleId.
      const unverifiedUser = {
        id: 'u-2',
        email: 'a@b.com',
        emailVerified: false,
      };
      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(unverifiedUser);
      nonceRepo.getDel.mockResolvedValue('1');

      const result = await service.signIn({
        credential: 'tok',
        nonce: 'nonce-1',
      });

      expect(usersService.linkGoogleId).toHaveBeenCalledWith('u-2', 'g-sub-1');
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result.user).toEqual({ id: 'u-2', email: 'a@b.com' });
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
      expect(nonceRepo.getDel).not.toHaveBeenCalled();
    });

    it('rejects with ApiAuthorizationError when payload.nonce mismatches the request nonce', async () => {
      verifyIdTokenSpy.mockResolvedValue(
        makeTicket(makePayload({ nonce: 'something-else' })) as never,
      );

      await expect(
        service.signIn({ credential: 'tok', nonce: 'nonce-1' }),
      ).rejects.toBeInstanceOf(ApiAuthorizationError);

      expect(usersService.findByGoogleId).not.toHaveBeenCalled();
      expect(nonceRepo.getDel).not.toHaveBeenCalled();
    });

    it('rejects with ApiNonceNotFoundError when the nonce key is missing in Redis (expired or already consumed)', async () => {
      nonceRepo.getDel.mockResolvedValue(null);

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

      expect(nonceRepo.getDel).not.toHaveBeenCalled();
    });

    it('rejects with ApiAuthorizationError when payload is missing sub or email', async () => {
      verifyIdTokenSpy.mockResolvedValue(
        makeTicket(makePayload({ sub: undefined })) as never,
      );

      await expect(
        service.signIn({ credential: 'tok', nonce: 'nonce-1' }),
      ).rejects.toBeInstanceOf(ApiAuthorizationError);
    });

    it('consumes the nonce key atomically exactly once on the success path (DoS resistance — getDel only after all checks pass)', async () => {
      // Anchor: google-auth.service.ts "burning the nonce before this would allow DoS"
      // Nonce is preserved on every rejection branch; consumed only on success.
      // GETDEL is atomic — closes the TOCTOU window between concurrent valid requests.
      usersService.findByGoogleId.mockResolvedValue({
        id: 'u-1',
        email: 'a@b.com',
      });
      nonceRepo.getDel.mockResolvedValue('1');

      await service.signIn({ credential: 'tok', nonce: 'nonce-1' });

      expect(nonceRepo.getDel).toHaveBeenCalledTimes(1);
      expect(nonceRepo.getDel).toHaveBeenCalledWith('nonce-1');
    });
  });
});
