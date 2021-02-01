import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { ProjectsService } from '../projects/projects.service';

import { ProjectRole } from './project-role.entity';
import { Project } from './../projects/project.entity';
import { Role } from './../roles/role.entity';

@Injectable()
export class ProjectRolesService {
    constructor(
        private configService: ConfigService,
        private projectsService: ProjectsService,
        private usersService: UsersService,
        private rolesService: RolesService,
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
        @InjectRepository(Project)
        private projectsRepository: Repository<Project>,
        @InjectRepository(ProjectRole)
        private projectRolesRepository: Repository<ProjectRole>
    ) {}

    async addOrUpdateUserToProject(projectFormatName: string, username: string, roleId: number){
        let project = await this.projectsRepository.findOne({formatName: projectFormatName}, 
          {relations: ["projectRoles", "projectRoles.user", "projectRoles.role"]});
  
        let projectRole = await this.projectRolesRepository.create();
  
        let user = await this.usersService.getByUsername(username, ["projectRoles", "projectRoles.project", "projectRoles.role"]);
        if(!user || !user.username){
          throw "Missing user";
        }
        let role = await this.rolesService.getById(roleId);
        if(!role || !role.name){
          throw "Missing role";
        }
  
        projectRole.user = user;
        projectRole.role = role;
  
        this.mergeOrAddProjectRole(project, projectRole);
        // We actually have to delete all the deprecated role entries (todo: might be fixed in later nestjs)
        var resp = await this.projectRolesRepository.delete({ user: projectRole.user, project: project });
        project = await this.projectsRepository.save(project);
  
        return projectRole;
      }

      async getProjectsByUser(userId: number): Promise<ProjectRole[]>{
        var projectRoles = await this.projectRolesRepository.find({
          relations: ["user", "project", "role"],
          where: {user: {id: userId}}
        });
        return projectRoles;
      }
  
  mergeOrAddProjectRole(project: Project, projectRole: ProjectRole): boolean{
    for(var roleKey in project.projectRoles){
      var existingRole = project.projectRoles[roleKey];
      if(existingRole.user && existingRole.user.username == projectRole.user.username){
        project.projectRoles[roleKey].role = projectRole.role;
        return false;
      }
    }
    project.projectRoles.push(projectRole);
    return true;
  }

  async create(post: any){
    return await this.addOrUpdateUserToProject(post.projectFormatName, post.username, post.roleId);
  }

}