import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';



import { ProjectRolesController } from './project-roles.controller';

import { CommonModule }             from '../common/common.module';
import { ProjectsModule }           from '../projects/projects.module';
import { UsersModule }              from '../users/users.module';
import { RolesModule }              from '../roles/roles.module';

import { ProjectRolesService }  from './project-roles.service';

import { ProjectRole }          from './project-role.entity';
import { Project }              from './../projects/project.entity';
import { User }                 from './../users/user.entity';
import { Role }                 from './../roles/role.entity';

@Module({
    imports: [
        CommonModule,
        ProjectsModule, 
        RolesModule, 
        UsersModule, 
        TypeOrmModule.forFeature([ProjectRole, Project, User, Role])
    ],
    controllers: [ProjectRolesController],
    exports: [ProjectRolesService],
    providers: [ProjectRolesService],
})
export class ProjectRolesModule {}
