import { Module } from '@nestjs/common';
import { SandboxController } from './sandbox.controller';

import { ClustersModule }     from '../clusters/clusters.module';
import { KubernetesModule }   from '../kubernetes/kubernetes.module';
import { ProjectsModule }     from '../projects/projects.module';
import { ProjectRolesModule } from '../project-roles/project-roles.module';
import { RolesModule }        from '../roles/roles.module';
import { UsersModule }        from '../users/users.module';
import { VendorsModule }       from '../vendors/vendors.module';

@Module({
  controllers: [SandboxController],
  imports: [
    ClustersModule, 
    KubernetesModule, 
    ProjectsModule,
    ProjectRolesModule,
    RolesModule, 
    UsersModule,
    VendorsModule
  ],
  providers: [],
  exports: []
})
export class SandboxModule {

}
