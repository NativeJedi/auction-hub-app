import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProxyThrottlerGuard } from './proxy-throttler.guard';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { AuthGuard, AuthorizedRequest } from './auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateAuthDto,
  RefreshAuthDto,
  LoginAuthDto,
  AuthResponseDto,
  RefreshResponseDto,
  RegisterResponseDto,
  ConfirmEmailResponseDto,
  ResendConfirmationDto,
  ResendConfirmationResponseDto,
} from './dto/auth.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';

@ApiBearerAuth('access-token')
@UseGuards(ProxyThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({
    status: 201,
    description: 'Registration initiated; confirmation email sent',
    type: RegisterResponseDto,
  })
  @Post('register')
  register(@Body() createAuthDto: CreateAuthDto): Promise<RegisterResponseDto> {
    return this.authService.register(createAuthDto);
  }

  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  @HttpCode(200)
  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto): Promise<AuthResponseDto> {
    return this.authService.login(loginAuthDto);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed',
    type: RefreshResponseDto,
  })
  @HttpCode(200)
  @Post('refresh')
  refresh(
    @Body() { refreshToken }: RefreshAuthDto,
  ): Promise<RefreshResponseDto> {
    return this.authService.refreshToken(refreshToken);
  }

  @ApiOperation({ summary: 'Mint a one-time nonce for Google Sign-In' })
  @ApiResponse({ status: 200, schema: { example: { nonce: 'abc123...' } } })
  @Get('google/nonce')
  async googleNonce(): Promise<{ nonce: string }> {
    const nonce = await this.googleAuthService.mintNonce();
    return { nonce };
  }

  @ApiOperation({ summary: 'Sign in with Google' })
  @ApiResponse({
    status: 200,
    description: 'Signed in via Google',
    type: AuthResponseDto,
  })
  @HttpCode(200)
  @Post('google')
  googleAuth(@Body() dto: GoogleAuthDto): Promise<AuthResponseDto> {
    return this.googleAuthService.signIn(dto);
  }

  @ApiOperation({ summary: 'Confirm email address' })
  @ApiResponse({
    status: 200,
    description: 'Email confirmed',
    type: ConfirmEmailResponseDto,
  })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Get('confirm-email')
  confirmEmail(@Query('code') code: string): Promise<ConfirmEmailResponseDto> {
    return this.authService.confirmEmail(code);
  }

  @ApiOperation({ summary: 'Resend confirmation email' })
  @ApiResponse({
    status: 200,
    description: 'Confirmation email sent',
    type: ResendConfirmationResponseDto,
  })
  @HttpCode(200)
  @Post('resend-confirmation')
  resendConfirmation(
    @Body() dto: ResendConfirmationDto,
  ): Promise<ResendConfirmationResponseDto> {
    return this.authService.resendConfirmation(dto.email);
  }

  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Req() { user }: AuthorizedRequest) {
    return this.authService.logout(user.sub);
  }
}
