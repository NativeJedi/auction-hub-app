import { AppConfigService } from '../../config/app-config.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../types/roles';
import { RedisService } from '../redis/redis.service';
import { Injectable } from '@nestjs/common';

export type TokenPayload = {
  sub: string;
  email: string;
  role?: Role;
};

class JWTToken<T extends object> {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string | number,
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

  validate(token: string): T {
    return this.jwtService.verify<T>(token, {
      secret: this.secret,
    });
  }
}

@Injectable()
export class TokenService {
  accessToken: JWTToken<TokenPayload>;
  refreshToken: JWTToken<TokenPayload>;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {
    this.accessToken = new JWTToken<TokenPayload>(
      this.appConfig.jwt.JWT_ACCESS_SECRET,
      this.appConfig.jwt.JWT_ACCESS_TTL,
      this.jwtService,
    );

    this.refreshToken = new JWTToken<TokenPayload>(
      this.appConfig.jwt.JWT_REFRESH_SECRET,
      this.appConfig.jwt.JWT_REFRESH_TTL,
      this.jwtService,
    );
  }

  async generateTokens({ sub, email, role }: TokenPayload) {
    const payload: TokenPayload = { sub, email, role };

    const accessToken = this.accessToken.generate(payload);

    const refreshToken = this.refreshToken.generate(payload);

    await this.redis.set(
      `refresh_tokens:${sub}`,
      refreshToken,
      this.appConfig.jwt.JWT_REFRESH_TTL,
    );

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = this.refreshToken.validate(token);

      const storedToken = await this.redis.get(`refresh_tokens:${payload.sub}`);

      if (token !== storedToken) {
        return null;
      }

      return payload;
    } catch (e) {
      console.error(e);

      return null;
    }
  }

  validateAccessToken(token: string): TokenPayload | null {
    try {
      return this.accessToken.validate(token);
    } catch {
      return null;
    }
  }

  deleteRefreshToken(sub: TokenPayload['sub']) {
    return this.redis.del(`refresh_tokens:${sub}`);
  }
}
