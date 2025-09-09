import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserDto } from '../../users/dto/user.dto';

class AuthUserDto extends PickType(UserDto, ['id', 'email']) {}

class AuthDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 5, example: 'password123' })
  @MinLength(5)
  password: string;

  @ApiProperty({ example: 'some-access-token' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({ example: 'some-refresh-token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class CreateAuthDto extends PickType(AuthDto, ['email', 'password']) {}

export class LoginAuthDto extends PickType(CreateAuthDto, [
  'email',
  'password',
]) {}

export class RefreshAuthDto extends PickType(AuthDto, ['refreshToken']) {}

export class AuthResponseDto extends PickType(AuthDto, [
  'accessToken',
  'refreshToken',
]) {
  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}

export class RefreshResponseDto extends PickType(AuthDto, [
  'accessToken',
  'refreshToken',
]) {}
