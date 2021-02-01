import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, OnModuleInit } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectRole } from './project-role.entity';
import { ProjectRolePostDto } from './project-role-post.dto';
import { ProjectRolesService } from './project-roles.service';



@Controller('project-roles')
export class ProjectRolesController {
    private readonly logger = new Logger(ProjectRolesController.name);

    constructor(
        @InjectRepository(ProjectRole)
        private projectRolesRepository: Repository<ProjectRole>,
        private projectRolesService: ProjectRolesService,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(): Promise<ProjectRole[]> {
        this.logger.verbose("Finding all project-roles");
        return this.projectRolesRepository.find();
    }

    @UseGuards(JwtAuthGuard)
    @Post('')
    async create(@Body() postDto: ProjectRolePostDto) {
        return this.projectRolesService.create(postDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':projectRoleId')
    async update(@Param('projectRoleId') projectRoleId, @Body() postDto: ProjectRolePostDto) {
        return this.projectRolesService.create(postDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':projectRoleId')
    async delete(@Param('projectRoleId') projectRoleId) {
        return await this.projectRolesRepository.delete({id: projectRoleId});
    }

}
