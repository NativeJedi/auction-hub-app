import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard, AuthorizedRequest } from './auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateAuthDto,
  RefreshAuthDto,
  LoginAuthDto,
  AuthResponseDto,
  RefreshResponseDto,
} from './dto/auth.dto';

@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @Post('register')
  register(@Body() createAuthDto: CreateAuthDto): Promise<AuthResponseDto> {
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

  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Req() { user }: AuthorizedRequest) {
    return this.authService.logout(user!.sub);
  }
}
