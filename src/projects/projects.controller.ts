import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, OnModuleInit } from '@nestjs/common';
import { Logger } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectRolesGuard } from '../auth/project-roles.guard';
import { ProjectRoles } from '../auth/project-roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '../users/user.decorator';

import { Repository } from 'typeorm';

import { Project } from './project.entity';
import { ProjectPostDto } from './project-post.dto';

import { ProjectsService } from './projects.service';
import { ClustersService } from '../clusters/clusters.service';


@Controller('projects')
export class ProjectsController{
    private readonly logger = new Logger(ProjectsController.name);

    constructor(
        @InjectRepository(Project)
        private projectsRepository: Repository<Project>,
        private projectsService: ProjectsService,
        private clustersService: ClustersService
    ) {}
  

    @UseGuards(JwtAuthGuard)
    @Post('')
    async create(@Body() projectPost: any) {
        return this.projectsService.create(projectPost);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(): Promise<Project[]> {
        this.logger.verbose("Finding all projects");
        return this.projectsRepository.find({relations: ["projectRoles", "projectRoles.user", "projectRoles.role"]});
    }

    @UseGuards(JwtAuthGuard)
    @Get('/count')
    async count(): Promise<Number> {
        this.logger.verbose("Counting projects");
        return this.projectsRepository.count();
    }

    @UseGuards(JwtAuthGuard, ProjectRolesGuard)
    @Get(':projectFormatName/clusters/:clusterFormatName/personal-token')
    @ProjectRoles(['edit', 'view', 'admin'])
    async getClusterToken(@Param('projectFormatName') projectFormatName, @Param('clusterFormatName') clusterFormatName, @User() user): Promise<any> {
        return this.clustersService.getProjectCluster(projectFormatName, clusterFormatName, user.username);
    }

    @UseGuards(JwtAuthGuard, ProjectRolesGuard)
    @Get(':projectFormatName/clusters/:clusterFormatName')
    @ProjectRoles(['edit', 'view', 'admin'])
    async findClusterToProject(@Param('projectFormatName') projectFormatName, @Param('clusterFormatName') clusterFormatName, @User() user): Promise<any> {
        return this.clustersService.getProjectCluster(projectFormatName, clusterFormatName, user.username);
    }

    @UseGuards(JwtAuthGuard, ProjectRolesGuard)
    @Get(':projectFormatName/clusters/')
    @ProjectRoles(['edit', 'view', 'admin'])
    async findClustersToProject(@Param('projectFormatName') formatName): Promise<any> {
        return this.clustersService.getProjectClusters(formatName);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':projectFormatName')
    async findOne(@Param('projectFormatName') formatName): Promise<any> {
        return this.projectsRepository.findOne({formatName: formatName}, {relations: ["projectRoles", "projectRoles.user", "projectRoles.role"]});
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':projectFormatName')
    async delete(@Param('projectFormatName') formatName) {
        return await this.projectsRepository.delete({formatName: formatName});
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':projectFormatName')
    async update(@Param('projectFormatName') formatName, @Body() projectPostDto: ProjectPostDto) {
        return this.projectsService.updateByDto(formatName, projectPostDto);
    }
    
}
