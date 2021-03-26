import { Module } from '@nestjs/common';
import { SandboxController } from './sandbox.controller';

import { CommonModule }       from '../common/common.module';
import { ClustersModule }     from '../clusters/clusters.module';
import { KubernetesModule }   from '../kubernetes/kubernetes.module';
import { ProjectsModule }     from '../projects/projects.module';
import { ProjectRolesModule } from '../project-roles/project-roles.module';
import { RolesModule }        from '../roles/roles.module';
import { UsersModule }        from '../users/users.module';
import { VendorsModule }       from '../vendors/vendors.module';

@Module({
  imports: [
    CommonModule,
    ClustersModule, 
    KubernetesModule, 
    ProjectsModule,
    ProjectRolesModule,
    RolesModule, 
    UsersModule,
    VendorsModule
  ],
  controllers: [ SandboxController ],
  providers: [],
  exports: []
})
export class SandboxModule {

}
