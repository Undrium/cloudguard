
import { ApiProperty } from '@nestjs/swagger';

export class UserPostDto {

  @ApiProperty({ example: 'The username of the user' })
  readonly username: string;
  @ApiProperty({ example: 'The Email of the user' })
  readonly email: string;
  @ApiProperty({ example: 'The type of user (admin/user)' })
  readonly usertype: string;
}