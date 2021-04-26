import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, OnModuleInit } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { MustHaveJwtGuard } from '../auth/must-have-jwt.guard';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Project } from '../projects/project.entity';

import { ResponseService }      from '../common/response.service';

import { ClustersService }      from '../clusters/clusters.service';
import { UsersService }         from '../users/users.service';
import { AzureDataSource }         from '../vendors/azure.data-source';
import { RolesService }         from '../roles/roles.service';
import { KubernetesService }    from '../kubernetes/kubernetes.service';
import { ProjectsService }      from '../projects/projects.service';
import { ProjectRolesService }  from '../project-roles/project-roles.service';

@Controller('sandbox')
export class SandboxController implements OnModuleInit{
    private readonly logger = new Logger(SandboxController.name);

    constructor(
        private clustersService: ClustersService,
        private kubernetesService: KubernetesService,
        private projectsService: ProjectsService,
        private projectRolesService: ProjectRolesService,
        private rolesService: RolesService,
        private usersService: UsersService,
        private azureDataSource: AzureDataSource,
        private responseService: ResponseService,
    ) {}

    async onModuleInit() {
        var project = await this.projectsService.upsert({"name": "kron", "kubernetesIdentifier": "kron"});
        var project2 = await this.projectsService.upsert({"name": "kron2", "kubernetesIdentifier": "kron2"});
        var project3 = await this.projectsService.upsert({"name": "kron3", "kubernetesIdentifier": "kron3"});
        var project4 = await this.projectsService.upsert({"name": "kron4", "kubernetesIdentifier": "kron4"});
        var role = await this.rolesService.upsert({"name": "edit"});
        var role2 = await this.rolesService.upsert({"name": "view"});
        var role3 = await this.rolesService.upsert({"name": "admin"});
        var user = await this.usersService.upsert({"username": "bumblebee"});
        this.projectRolesService.addOrUpdateUserToProject(project.formatName, user.username, role.id);
        this.projectRolesService.addOrUpdateUserToProject(project3.formatName, user.username, role2.id);
        this.projectRolesService.addOrUpdateUserToProject(project4.formatName, user.username, role3.id);

        //await this.kubernetesService.upsertArgo(cluster, {});
 
        //var createdClusterName = await this.azureService.createCluster({name: "cloudguard"});

        //await this.azureService.deleteCluster("cloudguard-generated");
        //this.statusLoop("cloudguard-generated");
        //var data = await this.clustersService.getAKSCluster("abra-generated");

        //var data = await this.azureService.getClusterAdminToken("hope-generated");
        
    }

    async statusLoop(name: string){
        const self=this;
        console.log("Getting status for " + name +"...");
        var data = await this.azureDataSource.getCluster(name);

        if(data && data.properties && data.properties.provisioningState){
            console.log(data.properties.provisioningState);
            setTimeout(function(){
                self.statusLoop(name);
            },3000);
        }else{
            console.log("Could not find any status for cluster " + name + ", aborting..");
            return;
        }

    }

    
}
