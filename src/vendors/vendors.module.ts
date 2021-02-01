import { Module } from '@nestjs/common';

import { AzureService }        from './azure.service';
import { AzureConfiguratorService }        from './azure-configurator.service';
import { KubernetesModule } from '../kubernetes/kubernetes.module';

@Module({
  controllers: [],
  imports: [KubernetesModule],
  providers: [AzureService, AzureConfiguratorService],
  exports: [AzureService, AzureConfiguratorService]
})
export class VendorsModule {

}
