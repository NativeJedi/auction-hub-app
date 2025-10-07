import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { TokenService } from './token.service';
import { CreateAuthDto, LoginAuthDto } from './dto/auth.dto';
import { ApiAuthorizationError } from '../../errors';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  private async validateUser({
    email,
    password,
  }: Pick<User, 'email' | 'password'>) {
    const user = await this.usersService.findByEmail(email, true);

    if (!user) {
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

  async register(createAuthDto: CreateAuthDto) {
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

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  async login({ email, password }: LoginAuthDto) {
    const user = await this.validateUser({ email, password });

    if (!user) {
      throw new ApiAuthorizationError();
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  async refreshToken(token: string) {
    const result = await this.tokenService.refreshToken.validate(token);

    if (!result.payload) {
      throw new ApiAuthorizationError();
    }

    return await this.generateTokens({
      id: result.payload.sub,
      email: result.payload.email,
    });
  }

  async logout(userId: User['id']) {
    await this.tokenService.refreshToken.clear(userId);
  }
}
