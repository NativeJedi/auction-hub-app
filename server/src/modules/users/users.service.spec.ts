import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: {
    findOneBy: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    usersRepo = {
      findOneBy: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findByGoogleId', () => {
    it('returns the user when a row with that googleId exists', async () => {
      // T-001 DoD: findByGoogleId returns the matching user
      const user = { id: 'u-1', email: 'a@b.com', googleId: 'g-1' } as User;
      usersRepo.findOneBy.mockResolvedValue(user);

      const result = await service.findByGoogleId('g-1');

      expect(usersRepo.findOneBy).toHaveBeenCalledWith({ googleId: 'g-1' });
      expect(result).toBe(user);
    });

    it('returns null when no row with that googleId exists', async () => {
      usersRepo.findOneBy.mockResolvedValue(null);

      const result = await service.findByGoogleId('g-unknown');

      expect(result).toBeNull();
    });
  });

  describe('linkGoogleId', () => {
    it('sets googleId and emailVerified atomically via repository.update', async () => {
      // T-003 FR-5 / AC-5: Google has confirmed ownership; both fields must land in one write
      usersRepo.update.mockResolvedValue({ affected: 1 });

      await service.linkGoogleId('u-1', 'g-1');

      expect(usersRepo.update).toHaveBeenCalledTimes(1);
      expect(usersRepo.update).toHaveBeenCalledWith(
        { id: 'u-1' },
        { googleId: 'g-1', emailVerified: true },
      );
    });

    it('is a no-op (does not throw) when the target user does not exist', async () => {
      // TypeORM update returns affected=0 cleanly; callers guard upstream
      usersRepo.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.linkGoogleId('missing', 'g-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('setEmailVerified', () => {
    it('calls repository.update with { emailVerified: true } and the correct userId', async () => {
      // T-001 DoD / AC-2: single UPDATE, no SELECT round-trip
      usersRepo.update.mockResolvedValue({ affected: 1 });

      await service.setEmailVerified('u-1');

      expect(usersRepo.update).toHaveBeenCalledTimes(1);
      expect(usersRepo.update).toHaveBeenCalledWith('u-1', { emailVerified: true });
    });

    it('propagates a DB error if the repository throws', async () => {
      usersRepo.update.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.setEmailVerified('u-1')).rejects.toThrow('DB connection lost');
    });
  });
});
