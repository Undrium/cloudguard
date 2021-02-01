
import { ApiProperty } from '@nestjs/swagger';

export class ClusterGetDto {
  @ApiProperty({ example: 'Cluster Name' })
  public name: string;

  @ApiProperty({ example: 'Clusters formatname' })
  public formatName: string;

  @ApiProperty({ example: 'URL to the dashboard' })
  public dashboardUrl: string;

  @ApiProperty({ example: 'URL to the api' })
  public apiServer: string;

  @ApiProperty({ example: 'Access Token' })
  public personalToken: string;

  @ApiProperty({ example: 'Platform name' })
  public platform: string;

  @ApiProperty({ example: 'Namespaces available to this cluster' })
  public namespaces: any[];

  @ApiProperty({ example: 'Azure or Amazon for instance' })
  public vendor: string;

  @ApiProperty({ example: 'Clusters state at the vendor' })
  public vendorState: string;

  @ApiProperty({ example: 'Where the cluster is located' })
  public vendorLocation: string;

  constructor(cluster = null){
    if(cluster){
      this.load(cluster);
    }
  }

  async load(cluster: any){
    this.name = cluster.name;
    this.formatName = cluster.formatName;
    this.apiServer = cluster.apiServer;
    this.platform = cluster.platform;
    this.vendor = cluster.vendor;
    this.vendorState = cluster.vendorState;
    this.vendorLocation = cluster.vendorLocation;
  }
}