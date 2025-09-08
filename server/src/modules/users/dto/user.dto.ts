import { Role } from '../../../types/roles';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { PickType } from '@nestjs/mapped-types';

export class UserDto {
  @ApiProperty({ example: 'some-uuid' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'test@email.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(5)
  password: string;

  @ApiProperty({ enum: Role, default: Role.PARTICIPANT })
  role?: Role;
}

export class CreateUserDto extends PickType(UserDto, [
  'email',
  'password',
  'role',
] as const) {}
