import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectsService } from './projects.service';

import { RolesModule }    from '../roles/roles.module';
import { UsersModule }    from '../users/users.module';
import { ClustersModule } from '../clusters/clusters.module';

@Module({
  controllers: [ProjectsController],
  imports: [RolesModule, UsersModule, ClustersModule, TypeOrmModule.forFeature([Project])],
  providers: [ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {
  
}
