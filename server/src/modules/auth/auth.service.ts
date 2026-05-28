import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { RedisSimpleRepository } from '../redis/repositories/simple.repository';
import { compare as bcryptCompare, hash as bcryptHash } from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { TokenService } from './token.service';
import {
  CreateAuthDto,
  LoginAuthDto,
  RegisterResponseDto,
  ConfirmEmailResponseDto,
  ResendConfirmationResponseDto,
} from './dto/auth.dto';
import { ApiAuthorizationError } from '../../errors';

const CONFIRM_CODE_TTL_SECONDS = 86400; // 24 h

@Injectable()
export class AuthService {
  private readonly resendLimits: RedisSimpleRepository<number>;
  private readonly confirmCodes: RedisSimpleRepository<string>;

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    redis: RedisService,
  ) {
    this.resendLimits = redis.createSimpleRepository<number>(
      'resend_limits',
      3600,
    );
    this.confirmCodes = redis.createSimpleRepository<string>(
      'confirm_codes',
      CONFIRM_CODE_TTL_SECONDS,
    );
  }

  private async validateUser({
    email,
    password,
  }: Pick<User, 'email' | 'password'>) {
    const user = await this.usersService.findByEmail(email, true);

    if (!user || user.password === null) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const isPasswordValid = await bcryptCompare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private readonly generateTokens = async (
    user: Pick<User, 'id' | 'email'>,
  ) => {
    const tokens = [
      this.tokenService.accessToken,
      this.tokenService.refreshToken,
    ].map((token) =>
      token.generate({
        sub: user.id,
        email: user.email,
      }),
    );

    const [accessToken, refreshToken] = await Promise.all(tokens);

    return {
      accessToken,
      refreshToken,
    };
  };

  async register(createAuthDto: CreateAuthDto): Promise<RegisterResponseDto> {
    const { email, password } = createAuthDto;

    const existedUser = await this.usersService.findByEmail(email);

    // M-4: silently return success for existing emails to prevent enumeration
    if (existedUser) {
      return { status: 'pending_confirmation' };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const hashedPassword = await bcryptHash(password, 10);

    const user = await this.usersService.create({
      email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      password: hashedPassword,
    });

    const code = randomUUID();
    await this.confirmCodes.set(code, user.id);
    await this.emailService.sendConfirmationEmail(user.email, code);

    return { status: 'pending_confirmation' };
  }

  async login({ email, password }: LoginAuthDto) {
    const user = await this.validateUser({ email, password });

    if (!user) {
      throw new ApiAuthorizationError();
    }

    if (!user.emailVerified) {
      throw new HttpException('EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  async confirmEmail(code: string): Promise<ConfirmEmailResponseDto> {
    const userId = await this.confirmCodes.getDel(code);

    if (!userId) {
      throw new HttpException(
        'INVALID_CONFIRMATION_TOKEN',
        HttpStatus.FORBIDDEN,
      );
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new HttpException(
        'INVALID_CONFIRMATION_TOKEN',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.usersService.setEmailVerified(userId);

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  async resendConfirmation(
    email: string,
  ): Promise<ResendConfirmationResponseDto> {
    const user = await this.usersService.findByEmail(email);

    // M-1: always return email_sent to prevent account-existence enumeration
    if (!user || user.emailVerified) {
      return { status: 'email_sent' };
    }

    const count = (await this.resendLimits.get(email)) ?? 0;

    if (count >= 3) {
      throw new HttpException(
        'RESEND_LIMIT_EXCEEDED',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.resendLimits.set(email, count + 1);

    const code = randomUUID();
    await this.confirmCodes.set(code, user.id);
    await this.emailService.sendConfirmationEmail(email, code);

    return { status: 'email_sent' };
  }

  async refreshToken(token: string) {
    const result = await this.tokenService.refreshToken.validate(token);

    if (!result.payload) {
      throw new ApiAuthorizationError();
    }

    const newTokens = await this.generateTokens({
      id: result.payload.sub,
      email: result.payload.email,
    });

    return newTokens;
  }

  async logout(userId: User['id']) {
    await this.tokenService.refreshToken.clear(userId);
  }
}
