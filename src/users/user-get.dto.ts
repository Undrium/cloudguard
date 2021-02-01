
import { ApiProperty } from '@nestjs/swagger';

import { ProjectRole } from '../project-roles/project-role.entity';

export class UserGetDto {

  id: number;
  
  @ApiProperty({ example: 'username' })
  readonly username: string;

  @ApiProperty({ example: 'bad@emailexample.com' })
  readonly email: string;

  @ApiProperty({ example: 'user' })
  readonly usertype: string;

  @ApiProperty({})
  readonly preferences: any;

  @ApiProperty({ example: 'token' })
  public token: string;

  @ApiProperty({})
  public projectRoles: ProjectRole[];
  

  constructor(user: any){
      this.username = user.username;
      this.email = user.email || "noemail@noemailhaha.com";
      this.usertype = user.usertype || "user";
      this.projectRoles = user.projectRoles;
      this.preferences = user.preferences;
  }
}