import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonModule }         from '../common/common.module';

import { KubernetesService }    from './kubernetes.service';
import { ClientService }        from './client.service';
import { CloneService }         from './clone.service';
import { RbacService }          from './rbac.service';

@Module({
  controllers: [],
  imports: [ CommonModule ],
  providers: [
    ClientService,
    CloneService,
    KubernetesService,
    RbacService
  ],
  exports: [
    ClientService,
    CloneService,
    KubernetesService,
    RbacService
  ]
})
export class KubernetesModule {}
