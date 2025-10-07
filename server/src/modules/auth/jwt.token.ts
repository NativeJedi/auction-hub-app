import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { RedisSimpleRepository } from '../redis/repositories/simple.repository';
import { RedisService } from '../redis/redis.service';
import { TokenPayload } from './token.service';

type SuccessValidateResult<T> = {
  payload: T;
};

type ErrorValidateResult = {
  payload: null;
  reason: 'expired' | 'invalid';
};

type ValidateTokenResult<T> = SuccessValidateResult<T> | ErrorValidateResult;

export class JWTToken<T extends object> {
  constructor(
    private readonly secret: string,
    readonly expiresIn: number,
    private readonly jwtService: JwtService,
  ) {
    this.jwtService = jwtService;
  }

  generate(payload: T): string {
    return this.jwtService.sign(payload, {
      secret: this.secret,
      expiresIn: this.expiresIn,
    });
  }

  validate(token: string): ValidateTokenResult<T> {
    try {
      const payload = this.jwtService.verify<T>(token, {
        secret: this.secret,
      });

      return { payload };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return { reason: 'expired', payload: null };
      }

      return { reason: 'invalid', payload: null };
    }
  }
}

export class RefreshToken {
  private readonly refreshTokens: RedisSimpleRepository<string>;

  constructor(
    private readonly refreshTokenInstance: JWTToken<TokenPayload>,
    redis: RedisService,
  ) {
    this.refreshTokens = new RedisSimpleRepository<string>(
      redis.getClient(),
      'refresh_tokens',
      refreshTokenInstance.expiresIn,
    );
  }

  async generate(payload: TokenPayload) {
    const refreshToken = this.refreshTokenInstance.generate(payload);

    await this.refreshTokens.set(payload.sub, refreshToken);

    return refreshToken;
  }

  async validate(token: string) {
    const result = this.refreshTokenInstance.validate(token);

    if (!result.payload) {
      return { reason: 'invalid', payload: null };
    }

    const { payload } = result;

    const storedToken = await this.refreshTokens.get(payload.sub);

    if (!storedToken || token !== storedToken) {
      return { reason: 'invalid', payload: null };
    }

    return result;
  }

  async clear(userId: string) {
    await this.refreshTokens.clear(userId);
  }
}
