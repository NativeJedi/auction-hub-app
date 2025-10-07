import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInviteDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Email of the invited user',
    example: 'invitee@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @ApiProperty({
    description: 'Name of the invited user',
    example: 'John Doe',
  })
  name: string;
}

export class ConfirmInviteDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Token that sent on user email',
  })
  token: string;
}
