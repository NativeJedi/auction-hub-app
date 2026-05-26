import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { PickType } from '@nestjs/mapped-types';

export class UserDto {
  @ApiProperty({ example: 'some-uuid' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'test@email.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'password123', nullable: true })
  @IsOptional()
  @MinLength(5)
  password: string | null;

  @ApiProperty({ example: 'google-sub-id', nullable: true, required: false })
  @IsOptional()
  @IsString()
  googleId?: string;
}

export class CreateUserDto extends PickType(UserDto, [
  'email',
  'password',
  'googleId',
] as const) {}
