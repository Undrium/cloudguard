import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, OnModuleInit } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { MustHaveJwtGuard } from '../auth/must-have-jwt.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ResponseService }  from '../common/response.service';

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
        private responseService: ResponseService,
    ) {}

    @UseGuards(MustHaveJwtGuard)
    @Get()
    async findAll(): Promise<any> {
        this.logger.verbose("Finding all project-roles");
        var projects = await this.projectRolesRepository.find();
        return this.responseService.createResponse(projects, "Got all project roles.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Post('')
    async create(@Body() postDto: ProjectRolePostDto) {
        var response = await this.projectRolesService.create(postDto);
        return this.responseService.createResponse(response, "Created project role.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Patch(':projectRoleId')
    async update(@Param('projectRoleId') projectRoleId, @Body() postDto: ProjectRolePostDto) {
        var response = await this.projectRolesService.create(postDto);
        return this.responseService.createResponse(response, "Updated project role.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Delete(':projectRoleId')
    async delete(@Param('projectRoleId') projectRoleId) {
        var response = await this.projectRolesRepository.delete({id: projectRoleId});
        return this.responseService.createResponse(response, "Deleted project role.");
    }

}
