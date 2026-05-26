import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token (JWT) returned by GIS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  credential: string;

  @ApiProperty({
    description: 'Nonce passed to GIS, must match server-stored value',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  nonce: string;
}
