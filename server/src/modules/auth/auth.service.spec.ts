import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { AppConfigService } from '../../config/app-config.service';
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
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let resendLimits: { get: jest.Mock; set: jest.Mock };
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
    resendLimits = { get: jest.fn().mockResolvedValue(null), set: jest.fn() };
    emailService = { sendConfirmationEmail: jest.fn() };
    jwtService = {
      sign: jest.fn().mockReturnValue('confirm-token'),
      verify: jest.fn(),
    };

    const redisService = {
      createSimpleRepository: jest.fn().mockReturnValue(resendLimits),
    };
    const appConfig = { jwt: { JWT_ACCESS_SECRET: 'test-secret' } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
        { provide: EmailService, useValue: emailService },
        { provide: JwtService, useValue: jwtService },
        { provide: AppConfigService, useValue: appConfig },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(AuthService);

    bcryptCompareSpy = jest.spyOn(bcrypt, 'compare');
    bcryptHashSpy = jest.spyOn(bcrypt, 'hash');
  });

  afterEach(() => {
    bcryptCompareSpy.mockRestore();
    bcryptHashSpy.mockRestore();
  });

  describe('register', () => {
    it('sends a confirmation email and returns { status: pending_confirmation }', async () => {
      // FR-1 / AC-1: registration triggers confirmation email; no tokens issued yet
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

      expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'confirm-token',
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

    it('throws BadRequestException when email already exists', async () => {
      // FR-1: existing email must be rejected before creating a duplicate
      usersService.findByEmail.mockResolvedValue({
        id: 'u-existing',
        email: 'test@example.com',
      });

      await expect(
        service.register({ email: 'test@example.com', password: 'secret' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(usersService.create).not.toHaveBeenCalled();
      expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });
  });

  describe('confirmEmail', () => {
    it('calls setEmailVerified and returns auth tokens on a valid confirmation token', async () => {
      // AC-2: clicking the link marks the account verified and allows login (auto-login)
      jwtService.verify.mockReturnValue({
        sub: 'u-1',
        purpose: 'email_confirmation',
      });
      usersService.findById.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
      });

      const result = await service.confirmEmail('valid-token');

      expect(usersService.setEmailVerified).toHaveBeenCalledWith('u-1');
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'u-1', email: 'test@example.com' },
      });
    });

    it('throws 403 INVALID_CONFIRMATION_TOKEN on expired token', async () => {
      // FR-3: expired JWT must be rejected with a distinct error code
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.confirmEmail('expired-token')).rejects.toMatchObject(
        {
          status: HttpStatus.FORBIDDEN,
          message: 'INVALID_CONFIRMATION_TOKEN',
        },
      );
    });

    it('throws 403 INVALID_CONFIRMATION_TOKEN on token with wrong purpose', async () => {
      // FR-3: access/refresh tokens must not be usable as confirmation tokens
      jwtService.verify.mockReturnValue({
        sub: 'u-1',
        purpose: 'access_token',
      });

      await expect(
        service.confirmEmail('wrong-purpose-token'),
      ).rejects.toMatchObject({
        status: HttpStatus.FORBIDDEN,
        message: 'INVALID_CONFIRMATION_TOKEN',
      });

      expect(usersService.setEmailVerified).not.toHaveBeenCalled();
    });
  });

  describe('resendConfirmation', () => {
    it('increments Redis counter and sends email on first call', async () => {
      // FR-4 / AC-4: first resend succeeds; counter incremented from 0 to 1
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        emailVerified: false,
      });
      resendLimits.get.mockResolvedValue(null); // no prior calls

      const result = await service.resendConfirmation('test@example.com');

      expect(resendLimits.set).toHaveBeenCalledWith('test@example.com', 1);
      expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'confirm-token',
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
      resendLimits.get.mockResolvedValue(3); // counter already at limit

      await expect(
        service.resendConfirmation('test@example.com'),
      ).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: 'RESEND_LIMIT_EXCEEDED',
      });

      expect(resendLimits.set).not.toHaveBeenCalled();
      expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it('returns already_verified when user.emailVerified is true', async () => {
      // FR-4: no-op when account is already confirmed; avoid resending unnecessarily
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        emailVerified: true,
      });

      const result = await service.resendConfirmation('test@example.com');

      expect(result).toEqual({ status: 'already_verified' });
      expect(emailService.sendConfirmationEmail).not.toHaveBeenCalled();
    });

    it('returns generic success response when email not found (email enumeration guard)', async () => {
      // T-002 §7: do not reveal whether an email is registered
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
