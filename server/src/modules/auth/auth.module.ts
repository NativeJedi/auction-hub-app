import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { TokenService } from './token.service';
import { AppConfigService } from '../../config/app-config.service';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
  ],
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
