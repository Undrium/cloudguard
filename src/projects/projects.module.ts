import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsController } from './projects.controller';

import { Project } from './project.entity';
import { ProjectsService } from './projects.service';

import { CommonModule }         from '../common/common.module';
import { KubernetesModule }     from '../kubernetes/kubernetes.module';
import { RolesModule }          from '../roles/roles.module';
import { UsersModule }          from '../users/users.module';
import { ClustersModule }       from '../clusters/clusters.module';

@Module({
  imports: [
    CommonModule,
    KubernetesModule,
    RolesModule, 
    UsersModule, 
    ClustersModule, 
    TypeOrmModule.forFeature([Project])
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {
  
}
