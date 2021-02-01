
import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from "../project-roles/project-role.entity";


export class ProjectPostDto {

  @ApiProperty({ example: 'The Name of the project' })
  readonly name: string;
  @ApiProperty({ example: 'A kubernetes identifier for the project' })
  readonly kubernetesIdentifier: string;
  @ApiProperty({ example: 'The Roles for the project' })
  readonly projectRoles: ProjectRole[];
}