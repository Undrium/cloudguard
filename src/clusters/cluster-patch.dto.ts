
import { ApiProperty } from '@nestjs/swagger';

export class ClusterPatchDto {
  @ApiProperty({ example: 'Cluster Name' })
  readonly name: string;

  @ApiProperty({ example: 'API Server URL' })
  readonly apiServer: string;

  @ApiProperty({ example: 'Platform name (KUBERNETES/OPENSHIFT4)' })
  public platform: string;

}