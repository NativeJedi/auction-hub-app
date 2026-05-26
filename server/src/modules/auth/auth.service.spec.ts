import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UsersService } from '../users/users.service';
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
      ],
    }).compile();

    service = module.get(AuthService);

    bcryptCompareSpy = jest.spyOn(bcrypt, 'compare');
  });

  afterEach(() => {
    bcryptCompareSpy.mockRestore();
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
      // FR-7: existing email-password login continues to work unchanged
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'a@b.com',
        password: 'hashed-pw',
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
