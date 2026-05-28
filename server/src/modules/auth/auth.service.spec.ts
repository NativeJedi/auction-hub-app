import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcryptModule from 'bcrypt';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { ApiAuthorizationError } from '../../errors';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
    setEmailVerified: jest.Mock;
    findById: jest.Mock;
  };
  let tokenService: {
    accessToken: { generate: jest.Mock };
    refreshToken: { generate: jest.Mock };
  };
  let emailService: { sendConfirmationEmail: jest.Mock };
  let resendLimits: { get: jest.Mock; set: jest.Mock };
  let confirmCodes: { get: jest.Mock; set: jest.Mock; getDel: jest.Mock };
  let bcryptCompareSpy: jest.SpyInstance;
  let bcryptHashSpy: jest.SpyInstance;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      setEmailVerified: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };
    tokenService = {
      accessToken: { generate: jest.fn().mockResolvedValue('access-token') },
      refreshToken: { generate: jest.fn().mockResolvedValue('refresh-token') },
    };
    resendLimits = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };
    confirmCodes = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      getDel: jest.fn(),
    };
    emailService = { sendConfirmationEmail: jest.fn() };

    const redisService = {
      createSimpleRepository: jest
        .fn()
        .mockImplementation((namespace: string) => {
          if (namespace === 'confirm_codes') return confirmCodes;
          return resendLimits;
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
        { provide: EmailService, useValue: emailService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(AuthService);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    bcryptCompareSpy = jest.spyOn(bcryptModule, 'compare');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    bcryptHashSpy = jest.spyOn(bcryptModule, 'hash');
  });

  afterEach(() => {
    bcryptCompareSpy.mockRestore();
    bcryptHashSpy.mockRestore();
  });

  describe('register', () => {
    it('stores a confirmation code in Redis, sends a confirmation email, and returns { status: pending_confirmation }', async () => {
      // FR-1 / AC-1: registration triggers confirmation email via opaque code; no tokens issued yet
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
      });
      bcryptHashSpy.mockResolvedValue('hashed-pw' as never);

      const result = await service.register({
        email: 'test@example.com',
        password: 'secret',
      });

      expect(confirmCodes.set).toHaveBeenCalledTimes(1);
      const [[code, userId]] = confirmCodes.set.mock.calls as [
        [string, string],
      ];
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
      expect(userId).toBe('u-1');
      expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        code,
      );
      expect(result).toEqual({ status: 'pending_confirmation' });
    });

    it('does NOT call tokenService to generate tokens', async () => {
      // FR-1 / AC-1: user cannot log in before confirming; no tokens at registration
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
      });
      bcryptHashSpy.mockResolvedValue('hashed-pw' as never);

      await service.register({ email: 'test@example.com', password: 'secret' });

      expect(tokenService.accessToken.generate).not.toHaveBeenCalled();
      expect(tokenService.refreshToken.generate).not.toHaveBeenCalled();
    });

    it('returns pending_confirmation silently when email already exists (M-4 anti-enumeration)', async () => {
      // M-4: existing email must not reveal account existence via a different response shape
      usersService.findByEmail.mockResolvedValue({
        id: 'u-existing',
        email: 'test@example.com',
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'secret',
      });

      expect(result).toEqual({ status: 'pending_confirmation' });
      expect(usersService.create).not.toHaveBeenCalled();
      expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });
  });

  describe('confirmEmail', () => {
    it('burns the confirmation code, calls setEmailVerified, and returns auth tokens', async () => {
      // AC-2: clicking the link marks the account verified and auto-logs the user in (single-use via getDel)
      confirmCodes.getDel.mockResolvedValue('u-1');
      usersService.findById.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
      });

      const result = await service.confirmEmail('valid-code');

      expect(confirmCodes.getDel).toHaveBeenCalledWith('valid-code');
      expect(usersService.setEmailVerified).toHaveBeenCalledWith('u-1');
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'u-1', email: 'test@example.com' },
      });
    });

    it('throws 403 INVALID_CONFIRMATION_TOKEN when code is not found in Redis (expired or already used)', async () => {
      // FR-3: expired or already-consumed code must be rejected with a distinct error code
      confirmCodes.getDel.mockResolvedValue(null);

      await expect(service.confirmEmail('expired-code')).rejects.toMatchObject({
        status: HttpStatus.FORBIDDEN,
        message: 'INVALID_CONFIRMATION_TOKEN',
      });

      expect(usersService.setEmailVerified).not.toHaveBeenCalled();
    });

    it('throws 403 INVALID_CONFIRMATION_TOKEN when the userId in Redis points to a non-existent user', async () => {
      // Edge case: code exists but user was deleted between registration and confirmation
      confirmCodes.getDel.mockResolvedValue('ghost-id');
      usersService.findById.mockResolvedValue(null);

      await expect(service.confirmEmail('orphaned-code')).rejects.toMatchObject(
        {
          status: HttpStatus.FORBIDDEN,
          message: 'INVALID_CONFIRMATION_TOKEN',
        },
      );

      expect(usersService.setEmailVerified).not.toHaveBeenCalled();
    });
  });

  describe('resendConfirmation', () => {
    it('increments Redis counter, stores a new code, and sends email on first call', async () => {
      // FR-4 / AC-4: first resend succeeds; counter incremented from 0 to 1
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        emailVerified: false,
      });
      resendLimits.get.mockResolvedValue(null);

      const result = await service.resendConfirmation('test@example.com');

      expect(resendLimits.set).toHaveBeenCalledWith('test@example.com', 1);
      expect(confirmCodes.set).toHaveBeenCalledTimes(1);
      const [[code]] = confirmCodes.set.mock.calls as [[string]];
      expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        code,
      );
      expect(result).toEqual({ status: 'email_sent' });
    });

    it('throws 429 RESEND_LIMIT_EXCEEDED on the 4th call for same email', async () => {
      // FR-4 / AC-4: rate-limited to 3 per hour; 4th attempt must be rejected
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        emailVerified: false,
      });
      resendLimits.get.mockResolvedValue(3);

      await expect(
        service.resendConfirmation('test@example.com'),
      ).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: 'RESEND_LIMIT_EXCEEDED',
      });

      expect(resendLimits.set).not.toHaveBeenCalled();
      expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it('returns email_sent silently when account is already verified (M-1 anti-enumeration)', async () => {
      // M-1: do not reveal whether an account is registered and verified
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        emailVerified: true,
      });

      const result = await service.resendConfirmation('test@example.com');

      expect(result).toEqual({ status: 'email_sent' });
      expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it('returns email_sent silently when email is not registered (anti-enumeration)', async () => {
      // M-1: same response shape for unknown email as for known email
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.resendConfirmation('ghost@example.com');

      expect(result).toEqual({ status: 'email_sent' });
      expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects with ApiAuthorizationError when the email is unknown', async () => {
      // FR-7: existing password flow returns generic error for unknown email
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@b.com', password: 'pw' }),
      ).rejects.toBeInstanceOf(ApiAuthorizationError);

      expect(bcryptCompareSpy).not.toHaveBeenCalled();
    });

    it('rejects with ApiAuthorizationError when stored password is null (Google-only account)', async () => {
      // T-001 DoD: a Google-only user cannot log in via the password endpoint
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'g@b.com',
        password: null,
      });

      await expect(
        service.login({ email: 'g@b.com', password: 'pw' }),
      ).rejects.toBeInstanceOf(ApiAuthorizationError);

      expect(bcryptCompareSpy).not.toHaveBeenCalled();
    });

    it('throws 403 EMAIL_NOT_VERIFIED when user has not confirmed their email', async () => {
      // FR-2 / AC-3: unverified accounts are blocked; distinct error code for the client
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'unverified@b.com',
        password: 'hashed-pw',
        emailVerified: false,
      });
      bcryptCompareSpy.mockResolvedValue(true as never);

      await expect(
        service.login({ email: 'unverified@b.com', password: 'pw' }),
      ).rejects.toMatchObject({
        status: HttpStatus.FORBIDDEN,
        message: 'EMAIL_NOT_VERIFIED',
      });
    });

    it('returns tokens when stored user has a non-null password matching the input', async () => {
      // FR-7: existing email-password login continues to work unchanged (verified account)
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'a@b.com',
        password: 'hashed-pw',
        emailVerified: true,
      });
      bcryptCompareSpy.mockResolvedValue(true as never);

      const result = await service.login({ email: 'a@b.com', password: 'pw' });

      expect(bcryptCompareSpy).toHaveBeenCalledWith('pw', 'hashed-pw');
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'u-1', email: 'a@b.com' },
      });
    });
  });
});
