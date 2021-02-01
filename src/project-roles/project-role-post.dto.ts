
import { ApiProperty } from '@nestjs/swagger';

export class ProjectRolePostDto {
  @ApiProperty({ example: 'Project FormatName' })
  readonly projectFormatName: string;

  @ApiProperty({ example: 'User username' })
  readonly username: string;

  @ApiProperty({ example: 'Role Id' })
  readonly roleId: number;
}