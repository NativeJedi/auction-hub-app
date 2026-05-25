import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { TokenService } from './token.service';
import { AppConfigService } from '../../config/app-config.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleAuthService,
    AuthGuard,
    JwtService,
    TokenService,
    AppConfigService,
  ],
  exports: [
    AuthService,
    GoogleAuthService,
    AuthGuard,
    JwtService,
    TokenService,
    AppConfigService,
  ],
})
export class AuthModule {}
