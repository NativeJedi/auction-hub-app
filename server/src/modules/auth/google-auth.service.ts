// OAuth scope is OpenID only (NFR-3); audience is verified by google-auth-library.
import { Injectable } from '@nestjs/common';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { AppConfigService } from '../../config/app-config.service';
import { ApiAuthorizationError, ApiNonceNotFoundError } from '../../errors';
import { RedisSimpleRepository } from '../redis/repositories/simple.repository';
import { RedisService } from '../redis/redis.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { TokenService } from './token.service';

const NONCE_NAMESPACE = 'oauth:nonce';
const NONCE_TTL_SECONDS = 300;

@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client;
  private readonly nonces: RedisSimpleRepository<string>;

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    redis: RedisService,
  ) {
    this.client = new OAuth2Client(this.appConfig.googleAuth.GOOGLE_CLIENT_ID);
    this.nonces = redis.createSimpleRepository<string>(
      NONCE_NAMESPACE,
      NONCE_TTL_SECONDS,
    );
  }

  async mintNonce(): Promise<string> {
    const nonce = randomBytes(32).toString('hex');
    await this.nonces.set(nonce, '1');
    return nonce;
  }

  async signIn({ credential, nonce }: GoogleAuthDto) {
    // Verify the token first — burning the nonce before this would allow DoS
    // (attacker submits garbage credential with a valid nonce to invalidate it).
    const payload = await this.verifyCredential(credential);

    const expectedNonce = Buffer.from(payload.nonce ?? '');
    const providedNonce = Buffer.from(nonce);
    if (
      expectedNonce.length !== providedNonce.length ||
      !timingSafeEqual(expectedNonce, providedNonce)
    ) {
      throw new ApiAuthorizationError();
    }

    if (payload.email_verified !== true) {
      throw new ApiAuthorizationError();
    }

    // All token-side checks passed — now consume the nonce exactly once.
    // Missing nonce here means TTL expired OR the credential was already used
    // (single-use; we delete on success). The server cannot tell these apart;
    // the client treats both as "session expired — try again" and re-inits.
    // Atomic GETDEL closes the TOCTOU window between concurrent requests
    // presenting the same {credential, nonce} pair.
    const nonceExists = await this.nonces.getDel(nonce);
    if (!nonceExists) {
      throw new ApiNonceNotFoundError();
    }

    const user = await this.resolveUser(payload);
    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  private async verifyCredential(
    credential: string,
  ): Promise<Required<Pick<TokenPayload, 'sub' | 'email'>> & TokenPayload> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.appConfig.googleAuth.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.sub || !payload.email) {
        throw new ApiAuthorizationError();
      }

      return payload as Required<Pick<TokenPayload, 'sub' | 'email'>> &
        TokenPayload;
    } catch (error) {
      if (error instanceof ApiAuthorizationError) {
        throw error;
      }
      throw new ApiAuthorizationError();
    }
  }

  private async resolveUser(
    payload: Required<Pick<TokenPayload, 'sub' | 'email'>>,
  ): Promise<User> {
    const byGoogleId = await this.usersService.findByGoogleId(payload.sub);
    if (byGoogleId) {
      return byGoogleId;
    }

    const byEmail = await this.usersService.findByEmail(payload.email);
    if (byEmail) {
      await this.usersService.linkGoogleId(byEmail.id, payload.sub);
      return byEmail;
    }

    return this.usersService.create({
      email: payload.email,
      googleId: payload.sub,
      password: null,
    });
  }

  private async generateTokens(user: Pick<User, 'id' | 'email'>) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.accessToken.generate({
        sub: user.id,
        email: user.email,
      }),
      this.tokenService.refreshToken.generate({
        sub: user.id,
        email: user.email,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
