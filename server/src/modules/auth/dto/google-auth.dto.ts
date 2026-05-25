import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token (JWT) returned by GIS' })
  @IsString()
  @IsNotEmpty()
  credential: string;

  @ApiProperty({
    description: 'Nonce passed to GIS, must match server-stored value',
  })
  @IsString()
  @IsNotEmpty()
  nonce: string;
}
