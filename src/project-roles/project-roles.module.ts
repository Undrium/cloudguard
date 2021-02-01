import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectRolesController } from './project-roles.controller';
import { ProjectRolesService } from './project-roles.service';

import { ProjectRole } from './project-role.entity';
import { Project } from './../projects/project.entity';
import { User } from './../users/user.entity';
import { Role } from './../roles/role.entity';

import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

@Module({
    controllers: [ProjectRolesController],
    exports: [ProjectRolesService],
    imports: [ProjectsModule, RolesModule, UsersModule, TypeOrmModule.forFeature([ProjectRole, Project, User, Role])],
    providers: [ProjectRolesService],
})
export class ProjectRolesModule {}
