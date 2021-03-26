import { Module }               from '@nestjs/common';
import { TypeOrmModule }        from '@nestjs/typeorm';

import { ClustersController }   from './clusters.controller';

import { CommonModule }         from '../common/common.module';
import { KubernetesModule }     from '../kubernetes/kubernetes.module';
import { UsersModule }          from '../users/users.module';
import { VendorsModule }        from '../vendors/vendors.module';

import { ClustersService }      from './clusters.service';
import { ProjectsService }      from '../projects/projects.service';

import { User }                 from '../users/user.entity';
import { Project }              from '../projects/project.entity';
import { Cluster }              from './cluster.entity';

@Module({
  controllers: [ClustersController],
  imports: [
    CommonModule,
    KubernetesModule, 
    UsersModule, 
    VendorsModule,
    TypeOrmModule.forFeature([Cluster]), 
    TypeOrmModule.forFeature([User]), 
    TypeOrmModule.forFeature([Project])
  ],
  providers: [ClustersService, ProjectsService],
  exports: [ClustersService, ProjectsService]
})
export class ClustersModule {}
