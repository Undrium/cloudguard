import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KubernetesService } from './kubernetes.service';
import { ClientService } from './client.service';
import { RbacService } from './rbac.service';

@Module({
  controllers: [],
  imports: [],
  providers: [
    ClientService,
    KubernetesService,
    RbacService
  ],
  exports: [
    ClientService,
    KubernetesService,
    RbacService
  ]
})
export class KubernetesModule {}
