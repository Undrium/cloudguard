import { Controller, Get, UseGuards, Param, Post, Body, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { Repository } from 'typeorm';
import { MustHaveJwtGuard } from '../auth/must-have-jwt.guard';

import { ResponseService }  from '../common/response.service';
import { RegistriesService } from './registries.service';
import { Registry } from './registry.entity';
import { RegistryPostDto } from './registry-post.dto';


@Controller('Registries')
export class RegistriesController {
    private readonly logger = new Logger(RegistriesController.name);
    constructor(
        private configService: ConfigService,
        @InjectRepository(Registry)
        private registryRepository: Repository<Registry>,
        private registriesService: RegistriesService,
        private responseService: ResponseService
    ) {}

    @UseGuards(MustHaveJwtGuard)
    @Get()
    async findAll(): Promise<any> {
        this.logger.verbose("Finding all Registries");
        var response = await this.registryRepository.find();
        return this.responseService.createResponse(response, "Found all registries.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Get('/count')
    async count(): Promise<any> {
        this.logger.verbose("Counting registries");
        var count = await this.registryRepository.count();
        return this.responseService.createResponse(count, "Counted registries.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Get(':formatName')
    async findOne(@Param('formatName') formatName): Promise<any> {
        var response = await this.registryRepository.findOne({ formatName: formatName });
        return this.responseService.createResponse(response, "Found registry.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Post()
    async create(@Body() registryPostDto:RegistryPostDto) {
        var response = await this.registriesService.create(registryPostDto);
        return this.responseService.createResponse(response, "Created registry.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Delete(':formatName')
    async DeleteRegistry(@Param('formatName') formatName) {
        var response = await this.registriesService.deleteRegistryByFormatName(formatName);
        return this.responseService.createResponse(response, "Deleted registry.");
    }

    
}
