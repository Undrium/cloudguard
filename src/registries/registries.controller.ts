import { Controller, Get, UseGuards, Param, Post, Body, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
        private registriesService: RegistriesService
    ) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(): Promise<Registry[]> {
        this.logger.verbose("Finding all Registries");
        return this.registryRepository.find();
    }

    @UseGuards(JwtAuthGuard)
    @Get('/count')
    async count(): Promise<Number> {
        this.logger.verbose("Counting registries");
        return this.registryRepository.count();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':formatName')
    async findOne(@Param('formatName') formatName): Promise<Registry> {
        return this.registryRepository.findOne({ formatName: formatName });
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() registryPostDto:RegistryPostDto) {
        return this.registriesService.create(registryPostDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':formatName')
    async DeleteRegistry(@Param('formatName') formatName) {
        return this.registriesService.deleteRegistryByFormatName(formatName);
    }

    
}
