import { AppConfigService } from '../../config/app-config.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { Injectable } from '@nestjs/common';
import { RedisSimpleRepository } from '../redis/repositories/simple.repository';
import { RoomRole } from '../../guards/room-roles/room-roles.constants';

export type TokenPayload = {
  sub: string;
  email: string;
};

export type RoomInviteTokenPayload = {
  sub: string;
  email: string;
};

export type RoomTokenPayload = {
  sub: string;
  email: string;
  name?: string;
  auctionId: string;
  roomId: string;
  role: RoomRole;
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

  validate(token: string): T | null {
    try {
      return this.jwtService.verify<T>(token, {
        secret: this.secret,
      });
    } catch {
      return null;
    }
  }
}

@Injectable()
export class TokenService {
  private readonly accessToken: JWTToken<TokenPayload>;
  private readonly refreshToken: JWTToken<TokenPayload>;
  private readonly roomMemberInviteToken: JWTToken<RoomInviteTokenPayload>;
  private readonly roomMemberToken: JWTToken<RoomTokenPayload>;

  private readonly refreshTokens: RedisSimpleRepository<string>;

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

    this.roomMemberInviteToken = new JWTToken<RoomInviteTokenPayload>(
      this.appConfig.jwt.JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET,
      this.appConfig.jwt.JWT_ROOM_MEMBER_INVITE_TOKEN_TTL,
      this.jwtService,
    );

    this.roomMemberToken = new JWTToken<RoomTokenPayload>(
      this.appConfig.jwt.JWT_ROOM_MEMBER_TOKEN_SECRET,
      this.appConfig.jwt.JWT_ROOM_TTL,
      this.jwtService,
    );

    this.refreshTokens = new RedisSimpleRepository<string>(
      this.redis.getClient(),
      'refresh_tokens',
      this.appConfig.jwt.JWT_REFRESH_TTL,
    );
  }

  async generateTokens(payload: TokenPayload) {
    const accessToken = this.accessToken.generate(payload);

    const refreshToken = this.refreshToken.generate(payload);

    await this.refreshTokens.set(payload.sub, refreshToken);

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(token: string): Promise<TokenPayload | null> {
    const payload = this.refreshToken.validate(token);

    if (!payload) {
      return null;
    }

    const storedToken = await this.refreshTokens.get(payload.sub);

    if (!storedToken || token !== storedToken) {
      return null;
    }

    return payload;
  }

  validateAccessToken(token: string): TokenPayload | null {
    return this.accessToken.validate(token);
  }

  deleteRefreshToken(sub: TokenPayload['sub']) {
    return this.refreshTokens.del(sub);
  }

  generateRoomInviteToken(payload: RoomInviteTokenPayload) {
    return this.roomMemberInviteToken.generate(payload);
  }

  validateRoomInviteToken(token: string): RoomInviteTokenPayload | null {
    return this.roomMemberInviteToken.validate(token);
  }

  validateRoomToken(token: string): RoomTokenPayload | null {
    return this.roomMemberToken.validate(token);
  }

  generateRoomToken(payload: RoomTokenPayload) {
    return this.roomMemberToken.generate(payload);
  }
}
