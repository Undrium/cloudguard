
import { ApiProperty } from '@nestjs/swagger';

export class ClusterPostDto {
  @ApiProperty({ example: 'Cluster Name' })
  readonly name: string;

  @ApiProperty({ example: 'API Server URL' })
  readonly apiServer: string;

  @ApiProperty({ example: 'Access Token' })
  readonly token: string;

  @ApiProperty({ example: 'sdazxczxsdasdfdgzxvzxcfzx' })
  readonly certData: string;

  @ApiProperty({ example: 'sdazxczxsdasdfdgzxvzxcfzx' })
  readonly keyData: string;

  @ApiProperty({ example: 'Platform name (KUBERNETES/OPENSHIFT4)' })
  public platform: string;
}