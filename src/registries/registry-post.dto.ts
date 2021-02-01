
import { ApiProperty } from '@nestjs/swagger';

export class RegistryPostDto {
  @ApiProperty({ example: 'Registry name' })
  readonly name: string;

  @ApiProperty({ example: 'Provider' })
  readonly provider: string;

  @ApiProperty({ example: 'URL' })
  readonly url: string;

  @ApiProperty({ example: 'Email' })
  readonly email: string;

  @ApiProperty({ example: 'Username' })
  readonly username: string;

  @ApiProperty({ example: 'Password' })
  readonly password: string;

  @ApiProperty({ example: 'Secret' })
  readonly secret: string;
}