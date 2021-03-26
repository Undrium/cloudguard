import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, OnModuleInit } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { MustHaveJwtGuard } from '../auth/must-have-jwt.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ResponseService }  from '../common/response.service';
import { RolesService } from './roles.service';

import { Role } from './role.entity';


@Controller('roles')
export class RolesController {
    private readonly logger = new Logger(RolesController.name);

    constructor(
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
        private rolesService: RolesService,
        private responseService: ResponseService
    ) {}

    @UseGuards(MustHaveJwtGuard)
    @Get()
    async findAll(): Promise<any> {
        this.logger.verbose("Finding all roles");
        var roles = await this.rolesRepository.find();
        return this.responseService.createResponse(roles, "Found all roles.");
    }

}
