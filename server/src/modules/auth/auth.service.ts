import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { TokenService } from './token.service';
import { CreateAuthDto, LoginAuthDto } from './dto/auth.dto';

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

    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens({
        sub: user.id,
        email: user.email,
      });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  async login({ email, password }: LoginAuthDto) {
    const user = await this.validateUser({ email, password });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens({
        sub: user.id,
        email: user.email,
      });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  async refreshToken(token: string) {
    const payload = await this.tokenService.validateRefreshToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return await this.tokenService.generateTokens({
      sub: payload.sub,
      email: payload.email,
    });
  }

  async logout(userId: User['id']) {
    await this.tokenService.deleteRefreshToken(userId);
  }
}
