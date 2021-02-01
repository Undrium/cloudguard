
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({ example: 'name' })
  readonly username: string;

  @ApiProperty({ example: 'pass' })
  readonly password: string;
}