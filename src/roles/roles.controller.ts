import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, OnModuleInit } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './role.entity';
import { RolesService } from './roles.service';



@Controller('roles')
export class RolesController {
    private readonly logger = new Logger(RolesController.name);

    constructor(
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
        private rolesService: RolesService,
    ) {}



    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(): Promise<Role[]> {
        this.logger.verbose("Finding all roles");
        return this.rolesRepository.find();
    }

}
