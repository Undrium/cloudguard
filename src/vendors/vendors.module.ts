import { Module } from '@nestjs/common';

import { CommonModule }       from '../common/common.module';

import { AzureDataSource }        from './azure.data-source';
import { AzureConfiguratorService }        from './azure-configurator.service';
import { KubernetesModule } from '../kubernetes/kubernetes.module';

@Module({
  controllers: [],
  imports: [ 
    CommonModule, 
    KubernetesModule
  ],
  providers: [AzureDataSource, AzureConfiguratorService],
  exports: [AzureDataSource, AzureConfiguratorService]
})
export class VendorsModule {

}
