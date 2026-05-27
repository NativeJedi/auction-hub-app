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
  let usersService: { findByEmail: jest.Mock };
  let tokenService: {
    accessToken: { generate: jest.Mock };
    refreshToken: { generate: jest.Mock };
  };
  let bcryptCompareSpy: jest.SpyInstance;

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn() };
    tokenService = {
      accessToken: { generate: jest.fn().mockResolvedValue('access-token') },
      refreshToken: { generate: jest.fn().mockResolvedValue('refresh-token') },
    };

    const resendLimits = { get: jest.fn().mockResolvedValue(null), set: jest.fn() };
    const redisService = { createSimpleRepository: jest.fn().mockReturnValue(resendLimits) };
    const emailService = { sendConfirmationEmail: jest.fn() };
    const jwtService = { sign: jest.fn().mockReturnValue('confirm-token'), verify: jest.fn() };
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
  });

  afterEach(() => {
    bcryptCompareSpy.mockRestore();
  });

  describe('register', () => {
    it.todo(
      'sends a confirmation email and returns { status: pending_confirmation }',
    );
    it.todo('does NOT call tokenService to generate tokens');
    it.todo('throws BadRequestException when email already exists');
  });

  describe('confirmEmail', () => {
    it.todo(
      'calls setEmailVerified and returns { status: confirmed } on a valid token',
    );
    it.todo('throws 403 INVALID_CONFIRMATION_TOKEN on expired token');
    it.todo(
      'throws 403 INVALID_CONFIRMATION_TOKEN on token with wrong purpose',
    );
  });

  describe('resendConfirmation', () => {
    it.todo('increments Redis counter and sends email on first call');
    it.todo('throws 429 RESEND_LIMIT_EXCEEDED on the 4th call for same email');
    it.todo('returns already_verified when user.emailVerified is true');
    it.todo('returns generic response (no throw) when email not found');
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
