import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { AppConfigService } from '../../config/app-config.service';
import { RedisService } from '../redis/redis.service';
import { RedisSimpleRepository } from '../redis/repositories/simple.repository';
import * as bcrypt from 'bcrypt';
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

type ConfirmationPayload = { sub: string; purpose: string };

@Injectable()
export class AuthService {
  private readonly resendLimits: RedisSimpleRepository<number>;

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfigService,
    redis: RedisService,
  ) {
    this.resendLimits = redis.createSimpleRepository<number>(
      'resend_limits',
      3600,
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

    const isPasswordValid = await bcrypt.compare(password, user.password);

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

  private signConfirmationToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, purpose: 'email_confirmation' },
      { secret: this.appConfig.jwt.JWT_ACCESS_SECRET, expiresIn: '86400' },
    );
  }

  async register(createAuthDto: CreateAuthDto): Promise<RegisterResponseDto> {
    const { email, password } = createAuthDto;

    const existedUser = await this.usersService.findByEmail(email);

    if (existedUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
    });

    const token = this.signConfirmationToken(user.id);
    await this.emailService.sendConfirmationEmail(user.email, token);

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

  async confirmEmail(token: string): Promise<ConfirmEmailResponseDto> {
    try {
      const payload = this.jwtService.verify<ConfirmationPayload>(token, {
        secret: this.appConfig.jwt.JWT_ACCESS_SECRET,
      });

      if (payload.purpose !== 'email_confirmation') {
        throw new HttpException(
          'INVALID_CONFIRMATION_TOKEN',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.usersService.setEmailVerified(payload.sub);

      const user = await this.usersService.findById(payload.sub);
      const { accessToken, refreshToken } = await this.generateTokens(user!);

      return { accessToken, refreshToken, user: { id: user!.id, email: user!.email } };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException(
        'INVALID_CONFIRMATION_TOKEN',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async resendConfirmation(email: string): Promise<ResendConfirmationResponseDto> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { status: 'email_sent' };
    }

    if (user.emailVerified) {
      return { status: 'already_verified' };
    }

    const count = (await this.resendLimits.get(email)) ?? 0;

    if (count >= 3) {
      throw new HttpException(
        'RESEND_LIMIT_EXCEEDED',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.resendLimits.set(email, count + 1);

    const token = this.signConfirmationToken(user.id);
    await this.emailService.sendConfirmationEmail(email, token);

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
