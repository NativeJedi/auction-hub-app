import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiProperty({ example: 'member@mail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Member', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  name: string;
}

export class ConfirmInviteDto {
  @ApiProperty({ description: 'Invite token', example: '1234567890' })
  token: string;
}
