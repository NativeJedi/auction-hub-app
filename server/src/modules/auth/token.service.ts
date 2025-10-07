import { AppConfigService } from '../../config/app-config.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { Injectable } from '@nestjs/common';
import { RoomRole } from '../room/entities/room.entity';
import { JWTToken, RefreshToken } from './jwt.token';

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
  roomId: string;
  role: RoomRole;
};

@Injectable()
export class TokenService {
  readonly accessToken: JWTToken<TokenPayload>;
  readonly refreshToken: RefreshToken;
  readonly roomMemberInviteToken: JWTToken<RoomInviteTokenPayload>;
  readonly roomMemberToken: JWTToken<RoomTokenPayload>;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly jwtService: JwtService,
    readonly redis: RedisService,
  ) {
    this.accessToken = new JWTToken<TokenPayload>(
      this.appConfig.jwt.JWT_ACCESS_SECRET,
      this.appConfig.jwt.JWT_ACCESS_TTL,
      this.jwtService,
    );

    this.refreshToken = new RefreshToken(
      new JWTToken<TokenPayload>(
        this.appConfig.jwt.JWT_REFRESH_SECRET,
        this.appConfig.jwt.JWT_REFRESH_TTL,
        this.jwtService,
      ),
      redis,
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
  }
}
