import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, OnModuleInit, HttpException, HttpStatus } from '@nestjs/common';

import { MustHaveJwtGuard } from '../auth/must-have-jwt.guard';
import { ProjectRolesGuard } from '../auth/project-roles.guard';
import { ProjectRoles } from '../auth/project-roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '../users/user.decorator';

import { Repository } from 'typeorm';

import { ClusterPostDto }   from '../clusters/cluster-post.dto';

import { Project } from './project.entity';
import { ProjectPostDto } from './project-post.dto';


import { LoggerService }        from '../logs/logs.service';
import { ResponseService }      from '../common/response.service';
import { CloneService }         from '../kubernetes/clone.service';
import { ProjectsService }      from './projects.service';
import { ClustersService }      from '../clusters/clusters.service';


@Controller('projects')
export class ProjectsController{


    constructor(
        @InjectRepository(Project)
        private projectsRepository: Repository<Project>,
        private projectsService: ProjectsService,
        private cloneService: CloneService,
        private clustersService: ClustersService,
        private logger: LoggerService,
        private responseService: ResponseService
    ) {
        this.logger.setContext(ProjectsController.name);
    }
  

    @UseGuards(MustHaveJwtGuard)
    @Post('')
    async create(@Body() projectPost: any) {
        var response = await this.projectsService.create(projectPost);
        return this.responseService.createResponse(response, "Created project.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Get()
    async findAll(): Promise<any> {
        this.logger.verbose("Finding all projects");
        var response = await this.projectsRepository.find({relations: ["projectRoles", "projectRoles.user", "projectRoles.role"]});
        return this.responseService.createResponse(response, "Found all projects.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Get('/count')
    async count(): Promise<any> {
        this.logger.verbose("Counting projects");
        var count = await this.projectsRepository.count();
        return this.responseService.createResponse(count, "Counted projects.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Get(':projectFormatName/clusters/:clusterFormatName/personal-token')
    @ProjectRoles(['edit', 'view', 'admin'])
    async getClusterToken(@Param('projectFormatName') projectFormatName, @Param('clusterFormatName') clusterFormatName, @User() user): Promise<any> {
        var response = await this.clustersService.getProjectCluster(projectFormatName, clusterFormatName, user.username);
        return this.responseService.createResponse(response, "Got project cluster token.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Get(':projectFormatName/clusters/:clusterFormatName')
    @ProjectRoles(['edit', 'view', 'admin'])
    async getProjectCluster(@Param('projectFormatName') projectFormatName, @Param('clusterFormatName') clusterFormatName, @User() user): Promise<any> {
        var response = await this.clustersService.getProjectCluster(projectFormatName, clusterFormatName, user.username);
        return this.responseService.createResponse(response, "Got project cluster.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Delete(':projectFormatName/clusters/:clusterFormatName')
    @ProjectRoles(['edit', 'view', 'admin'])
    async DeleteCluster(@Param('projectFormatName') projectFormatName, @Param('clusterFormatName') clusterFormatName) {
        var response = await this.clustersService.deleteClusterByFormatname(clusterFormatName);
        return this.responseService.createResponse(response, "Deleted cluster.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Post(':projectFormatName/clusters')
    @ProjectRoles(['edit', 'view', 'admin'])
    async createProjectExistingCluster(@Param('projectFormatName') projectFormatName, @Body() clusterPostDto: ClusterPostDto, @User() user) {
        var cluster = await this.clustersService.createExisting(clusterPostDto, projectFormatName);
        this.logger.addLogEntry(`${user.username} added an existing cluster (${cluster.formatName}) to the cloudguard.`, {
            clusterId: cluster.id,
            username: user.username,
            projectFormatName: projectFormatName
        }, "common");
        return this.responseService.createResponse(cluster, "Created existing cluster.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Post(':projectFormatName/clusters/aks')
    @ProjectRoles(['edit', 'view', 'admin'])
    async createProjectAksCluster(@Param('projectFormatName') projectFormatName, @Body() clusterData: any, @User() user) {
        try{
            var cluster = await this.clustersService.createAKSCluster(clusterData, projectFormatName);
            this.logger.addLogEntry(`${user.username} started creating an AKS cluster (${cluster['formatName']}).`, {
                clusterId: cluster['id'],
                username: user.username,
                projectFormatName: projectFormatName
            }, "cluster_creation_started");
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        return this.responseService.createResponse(cluster, "Started creating cluster in Azure.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Patch(':projectFormatName/clusters/aks/:formatName')
    @ProjectRoles(['edit', 'view', 'admin'])
    async patchProjectAksCluster(
        @Param('projectFormatName') projectFormatName, 
        @Param('formatName') formatName, 
        @Body() patchData: any, 
        @User() user
    ) {
        try{
            var cluster = await this.clustersService.patchAKSCluster(formatName, patchData);
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        this.logger.addLogEntry(`${user.username} started patching an AKS cluster (${cluster['formatName']}).`, {
            clusterId: cluster['id'],
            username: user.username,
            projectFormatName: projectFormatName,
            patchData: patchData
        }, "cluster_patching_started");

        return this.responseService.createResponse(cluster, "Started patching cluster in Azure.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Get(':projectFormatName/clusters/aks/:name/kubeconfig')
    @ProjectRoles(['edit', 'view', 'admin'])
    async getProjectAksKubeConfig(@Param('projectFormatName') projectFormatName, @Param('name') name) {
        try{
            var cluster = await this.clustersService.getAksKubeConfig(name);
        }catch(error){
            throw new HttpException("Azure did not like the request", HttpStatus.NOT_FOUND);
        }
        return this.responseService.createResponse(cluster, "Fetched KubeConfig from Azure.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Get(':projectFormatName/clusters/aks/:name/upgradeProfile')
    @ProjectRoles(['edit', 'view', 'admin'])
    async getProjectAksClusterUpgradeProfile(@Param('projectFormatName') projectFormatName, @Param('name') name) {
        try{
            var cluster = await this.clustersService.getUpgradeProfile(name);
        }catch(error){
            throw new HttpException("Azure did not like the request", HttpStatus.NOT_FOUND);
        }
        return this.responseService.createResponse(cluster, "Fetched cluster upgrade profile from Azure.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Get(':projectFormatName/clusters/aks/:name')
    @ProjectRoles(['edit', 'view', 'admin'])
    async getAksCluster(@Param('projectFormatName') projectFormatName, @Param('name') name) {
        try{
            var cluster = await this.clustersService.getCluster(name);
            var aksCluster = await this.clustersService.getAKSCluster(cluster);
        }catch(error){
            console.log(error);
            throw new HttpException("Azure did not like the request", HttpStatus.NOT_FOUND);
        }
        return this.responseService.createResponse(aksCluster, "Fetched cluster from Azure.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Delete(':projectFormatName/clusters/aks/:name')
    @ProjectRoles(['edit', 'view', 'admin'])
    async deleteAksCluster(@Param('projectFormatName') projectFormatName, @Param('name') name) {
        try{
            var response = await this.clustersService.deleteAKSCluster(name);
        }catch(error){
            throw new HttpException("Azure did not like the request", HttpStatus.NOT_FOUND);
        }
        return this.responseService.createResponse(response, "Deleted cluster in Azure.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Get(':projectFormatName/clusters/')
    @ProjectRoles(['edit', 'view', 'admin'])
    async findClustersToProject(@Param('projectFormatName') formatName): Promise<any> {
        var clusters = await this.clustersService.getProjectClusters(formatName); 
        return this.responseService.createResponse(clusters, "Got project clusters.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Get(':projectFormatName/clusters/:clusterFormatName/namespaces')
    @ProjectRoles(['edit', 'view', 'admin'])
    async getProjectsClustersNamespaces(
        @Param('projectFormatName') projectFormatName, 
        @Param('clusterFormatName') clusterFormatName, 
        @User() user
    ): Promise<any> {
        var response = await this.clustersService.getProjectsClustersNamespaces(projectFormatName, clusterFormatName);
        return this.responseService.createResponse(response, "Got project cluster namespaces.");
    }

    @UseGuards(MustHaveJwtGuard, ProjectRolesGuard)
    @Post(':projectFormatName/clusters/:sourceClusterformatName/namespaces/:namespaceFormatName/clone')
    @ProjectRoles(['edit', 'view', 'admin'])
    async clone(
        @Param('projectFormatName') projectFormatName, 
        @Param('sourceClusterformatName') sourceClusterformatName, 
        @Param('namespaceFormatName') namespaceFormatName, 
        @Body() cloneData: any,
        @User() user
    ) {

        var sourceCluster = await this.clustersService.getCluster(sourceClusterformatName);
        var targetCluster = await this.clustersService.getCluster(cloneData.targetClusterFormatName);
        
        try{
            await this.cloneService.cloneNamespaceAndContent(
                namespaceFormatName, 
                sourceCluster, 
                targetCluster, 
                cloneData
            );
        }catch(error){
            throw new HttpException(error, HttpStatus.METHOD_NOT_ALLOWED);
        }

        // Finally, do the cluster routine to make sure access is correct in cloned
        var response = await this.clustersService.getProjectCluster(projectFormatName, targetCluster.formatName, user.username);
        
        return this.responseService.createResponse(true, "Clone was succesful.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Get(':projectFormatName')
    async findOne(@Param('projectFormatName') formatName): Promise<any> {
        var project = await this.projectsRepository.findOne({formatName: formatName}, {relations: ["projectRoles", "projectRoles.user", "projectRoles.role"]});
        return this.responseService.createResponse(project, "Got project.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Delete(':projectFormatName')
    async delete(@Param('projectFormatName') formatName) {
        var response = await this.projectsRepository.delete({formatName: formatName});
        return this.responseService.createResponse(response, "Deleted project.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Patch(':projectFormatName')
    async update(@Param('projectFormatName') formatName, @Body() projectPostDto: ProjectPostDto) {
        var response = await this.projectsService.updateByDto(formatName, projectPostDto);
        return this.responseService.createResponse(response, "Updated project.");
    }
    
}
